import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks de todas as dependências pesadas/servidor das server actions.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: vi.fn(), get: vi.fn() })),
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/storage", () => ({ uploadImage: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    workspace: { update: vi.fn(), findUnique: vi.fn() },
    workspaceMember: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/workspace", () => ({
  getActiveWorkspace: vi.fn(),
  canManageWorkspace: (role: string) => role === "OWNER" || role === "ADMIN",
  WORKSPACE_COOKIE: "kaizen.ws",
}));

import {
  updateMemberRole,
  removeMember,
  updateWorkspaceBanner,
  removeWorkspaceBanner,
} from "@/lib/actions/workspace";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { uploadImage } from "@/lib/storage";

const mAuth = vi.mocked(auth);
const mActive = vi.mocked(getActiveWorkspace);
const mUpload = vi.mocked(uploadImage);
const mMember = vi.mocked(db.workspaceMember);
const mWorkspace = vi.mocked(db.workspace);

/** Helper para simular o workspace ativo com um papel do usuário logado. */
function activeAs(role: "OWNER" | "ADMIN" | "MEMBER") {
  mActive.mockResolvedValue({
    workspace: { id: "w1", slug: "ws" },
    role,
    memberships: [],
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mAuth.mockResolvedValue({ user: { id: "me" } } as never);
});

describe("updateMemberRole", () => {
  it("nega quem não é Owner/Admin", async () => {
    activeAs("MEMBER");
    const r = await updateMemberRole("m1", "ADMIN");
    expect(r.error).toMatch(/permiss/i);
    expect(mMember.update).not.toHaveBeenCalled();
  });

  it("rejeita papel inválido (ex.: OWNER)", async () => {
    activeAs("OWNER");
    const r = await updateMemberRole("m1", "OWNER" as never);
    expect(r.error).toMatch(/inválido/i);
    expect(mMember.update).not.toHaveBeenCalled();
  });

  it("protege o papel do Owner", async () => {
    activeAs("ADMIN");
    mMember.findUnique.mockResolvedValue({
      id: "m1",
      role: "OWNER",
      workspaceId: "w1",
      userId: "u2",
    } as never);
    const r = await updateMemberRole("m1", "MEMBER");
    expect(r.error).toMatch(/Owner/);
    expect(mMember.update).not.toHaveBeenCalled();
  });

  it("impede o usuário de alterar o próprio papel", async () => {
    activeAs("ADMIN");
    mMember.findUnique.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
      workspaceId: "w1",
      userId: "me",
    } as never);
    const r = await updateMemberRole("m1", "MEMBER");
    expect(r.error).toMatch(/próprio/i);
  });

  it("nega membro de outro workspace", async () => {
    activeAs("OWNER");
    mMember.findUnique.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
      workspaceId: "OUTRO",
      userId: "u2",
    } as never);
    const r = await updateMemberRole("m1", "ADMIN");
    expect(r.error).toMatch(/não encontrado/i);
  });

  it("promove MEMBER → ADMIN com sucesso", async () => {
    activeAs("OWNER");
    mMember.findUnique.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
      workspaceId: "w1",
      userId: "u2",
    } as never);
    mMember.update.mockResolvedValue({} as never);
    const r = await updateMemberRole("m1", "ADMIN");
    expect(r.success).toMatch(/Admin/);
    expect(mMember.update).toHaveBeenCalledWith({ where: { id: "m1" }, data: { role: "ADMIN" } });
  });
});

describe("removeMember", () => {
  it("nega Admin (só Owner remove)", async () => {
    activeAs("ADMIN");
    const r = await removeMember("m1");
    expect(r.error).toMatch(/Owner/);
    expect(mMember.delete).not.toHaveBeenCalled();
  });

  it("não remove o Owner", async () => {
    activeAs("OWNER");
    mMember.findUnique.mockResolvedValue({ id: "m1", role: "OWNER", workspaceId: "w1" } as never);
    const r = await removeMember("m1");
    expect(r.error).toMatch(/Owner/);
    expect(mMember.delete).not.toHaveBeenCalled();
  });

  it("remove um membro comum", async () => {
    activeAs("OWNER");
    mMember.findUnique.mockResolvedValue({ id: "m1", role: "MEMBER", workspaceId: "w1" } as never);
    mMember.delete.mockResolvedValue({} as never);
    const r = await removeMember("m1");
    expect(r.success).toBeTruthy();
    expect(mMember.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});

describe("banner do workspace", () => {
  it("updateWorkspaceBanner nega sem permissão", async () => {
    activeAs("MEMBER");
    const fd = new FormData();
    fd.set("banner", new File(["x"], "b.png", { type: "image/png" }));
    const r = await updateWorkspaceBanner(fd);
    expect(r.error).toMatch(/permiss/i);
    expect(mUpload).not.toHaveBeenCalled();
  });

  it("updateWorkspaceBanner exige um arquivo", async () => {
    activeAs("ADMIN");
    const r = await updateWorkspaceBanner(new FormData());
    expect(r.error).toMatch(/imagem/i);
  });

  it("updateWorkspaceBanner salva a URL no sucesso", async () => {
    activeAs("ADMIN");
    mUpload.mockResolvedValue({ url: "http://img/banner.png" } as never);
    mWorkspace.update.mockResolvedValue({} as never);
    const fd = new FormData();
    fd.set("banner", new File(["x"], "b.png", { type: "image/png" }));
    const r = await updateWorkspaceBanner(fd);
    expect(r.success).toBeTruthy();
    expect(mWorkspace.update).toHaveBeenCalledWith({
      where: { id: "w1" },
      data: { bannerImage: "http://img/banner.png" },
    });
  });

  it("removeWorkspaceBanner nega sem permissão", async () => {
    activeAs("MEMBER");
    const r = await removeWorkspaceBanner();
    expect(r.error).toMatch(/permiss/i);
    expect(mWorkspace.update).not.toHaveBeenCalled();
  });

  it("removeWorkspaceBanner limpa o campo", async () => {
    activeAs("OWNER");
    mWorkspace.update.mockResolvedValue({} as never);
    const r = await removeWorkspaceBanner();
    expect(r.success).toBeTruthy();
    expect(mWorkspace.update).toHaveBeenCalledWith({
      where: { id: "w1" },
      data: { bannerImage: null },
    });
  });
});
