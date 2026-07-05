import { describe, it, expect } from "vitest";

import { canManageWorkspaceRole, ROLE_LABELS } from "@/lib/roles";

describe("canManageWorkspaceRole", () => {
  it("permite OWNER e ADMIN", () => {
    expect(canManageWorkspaceRole("OWNER")).toBe(true);
    expect(canManageWorkspaceRole("ADMIN")).toBe(true);
  });

  it("nega MEMBER", () => {
    expect(canManageWorkspaceRole("MEMBER")).toBe(false);
  });
});

describe("ROLE_LABELS", () => {
  it("traz os rótulos em pt-BR", () => {
    expect(ROLE_LABELS.OWNER).toBe("Owner");
    expect(ROLE_LABELS.ADMIN).toBe("Admin");
    expect(ROLE_LABELS.MEMBER).toBe("Membro");
  });
});
