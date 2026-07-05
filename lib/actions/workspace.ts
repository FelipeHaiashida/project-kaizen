"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace, canManageWorkspace, WORKSPACE_COOKIE } from "@/lib/workspace";
import { uploadImage } from "@/lib/storage";
import { createWorkspaceSchema, updateWorkspaceSchema } from "@/lib/validations/workspace";

export type ActionState = { error?: string; success?: string };

const COOKIE_OPTS = {
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function setActiveWorkspaceCookie(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, slug, COOKIE_OPTS);
}

/** Cria um workspace, torna o usuário OWNER e o define como ativo. Redireciona ao dashboard. */
export async function createWorkspace(formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { name, slug } = parsed.data;

  const existing = await db.workspace.findUnique({ where: { slug } });
  if (existing) return { error: "Este slug já está em uso. Escolha outro." };

  let logo: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await uploadImage("workspace-logos", `${slug}/logo`, logoFile);
    if ("error" in result) return { error: result.error };
    logo = result.url;
  }

  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      logo,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  await setActiveWorkspaceCookie(workspace.slug);
  redirect("/dashboard");
}

/** Edita nome/slug/logo do workspace ativo (apenas Owner/Admin). */
export async function updateWorkspace(formData: FormData): Promise<ActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para editar" };

  const parsed = updateWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { name, slug } = parsed.data;

  if (slug !== active.workspace.slug) {
    const clash = await db.workspace.findUnique({ where: { slug } });
    if (clash) return { error: "Este slug já está em uso. Escolha outro." };
  }

  let logo: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await uploadImage("workspace-logos", `${slug}/logo`, logoFile);
    if ("error" in result) return { error: result.error };
    logo = result.url;
  }

  await db.workspace.update({
    where: { id: active.workspace.id },
    data: { name, slug, ...(logo ? { logo } : {}) },
  });

  if (slug !== active.workspace.slug) await setActiveWorkspaceCookie(slug);

  revalidatePath("/settings/workspace");
  revalidatePath("/", "layout");
  return { success: "Workspace atualizado" };
}

/** Define a imagem do banner do dashboard (apenas Owner/Admin). */
export async function updateWorkspaceBanner(formData: FormData): Promise<ActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para editar o banner" };

  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) return { error: "Nenhuma imagem enviada" };

  const result = await uploadImage("workspace-logos", `${active.workspace.slug}/banner`, file);
  if ("error" in result) return { error: result.error };

  await db.workspace.update({
    where: { id: active.workspace.id },
    data: { bannerImage: result.url },
  });

  revalidatePath("/dashboard");
  return { success: "Banner atualizado" };
}

/** Remove a imagem do banner do dashboard (apenas Owner/Admin). */
export async function removeWorkspaceBanner(): Promise<ActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para editar o banner" };

  await db.workspace.update({
    where: { id: active.workspace.id },
    data: { bannerImage: null },
  });

  revalidatePath("/dashboard");
  return { success: "Banner removido" };
}

/** Troca o workspace ativo (valida que o usuário é membro). */
export async function switchWorkspace(slug: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id, workspace: { slug } },
  });
  if (!membership) return;

  await setActiveWorkspaceCookie(slug);
  redirect("/dashboard");
}

/** Remove um membro do workspace ativo (apenas Owner; não remove o próprio Owner). */
export async function removeMember(memberId: string): Promise<ActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (active.role !== "OWNER") return { error: "Apenas o Owner pode remover membros" };

  const member = await db.workspaceMember.findUnique({ where: { id: memberId } });
  if (!member || member.workspaceId !== active.workspace.id) {
    return { error: "Membro não encontrado" };
  }
  if (member.role === "OWNER") return { error: "Não é possível remover o Owner" };

  await db.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath("/settings/workspace");
  return { success: "Membro removido" };
}

/**
 * Altera o papel de um membro entre ADMIN e MEMBER (apenas Owner/Admin).
 * Protege o Owner e impede que o usuário altere o próprio papel.
 */
export async function updateMemberRole(
  memberId: string,
  role: "ADMIN" | "MEMBER"
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para alterar papéis" };

  if (role !== "ADMIN" && role !== "MEMBER") return { error: "Papel inválido" };

  const member = await db.workspaceMember.findUnique({
    where: { id: memberId },
    select: { id: true, role: true, workspaceId: true, userId: true },
  });
  if (!member || member.workspaceId !== active.workspace.id) {
    return { error: "Membro não encontrado" };
  }
  if (member.role === "OWNER") return { error: "Não é possível alterar o papel do Owner" };
  if (member.userId === session.user.id) return { error: "Você não pode alterar seu próprio papel" };
  if (member.role === role) return { error: "O membro já tem esse papel" };

  await db.workspaceMember.update({ where: { id: memberId }, data: { role } });
  revalidatePath("/settings/workspace");
  return {
    success: role === "ADMIN" ? "Membro promovido a Admin" : "Admin rebaixado a Membro",
  };
}

/** Gera (ou reaproveita) um link de convite aberto para o workspace ativo. Retorna o token. */
export async function getInviteToken(): Promise<{ token: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para convidar" };

  const now = new Date();
  let invitation = await db.invitation.findFirst({
    where: { workspaceId: active.workspace.id, email: null, expiresAt: { gt: now } },
  });

  if (!invitation) {
    invitation = await db.invitation.create({
      data: {
        workspaceId: active.workspace.id,
        invitedById: session.user.id,
        role: "MEMBER",
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return { token: invitation.token };
}
