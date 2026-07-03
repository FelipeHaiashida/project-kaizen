import type { Role } from "@prisma/client";

/** Papéis com privilégio de gestão do workspace. Puro — seguro para client e server. */
export function canManageWorkspaceRole(role: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Membro",
};
