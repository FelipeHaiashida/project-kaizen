import "server-only";

import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageWorkspaceRole } from "@/lib/roles";
import type { Role, Workspace } from "@prisma/client";

export const WORKSPACE_COOKIE = "kaizen.ws";

export type MembershipWithWorkspace = { role: Role; workspace: Workspace };

export type ActiveWorkspace = {
  workspace: Workspace;
  role: Role;
  memberships: MembershipWithWorkspace[];
};

/** Lista os workspaces (com papel) dos quais o usuário é membro. */
export async function getUserMemberships(userId: string): Promise<MembershipWithWorkspace[]> {
  return db.workspaceMember.findMany({
    where: { userId },
    select: { role: true, workspace: true },
    orderBy: { joinedAt: "asc" },
  });
}

/**
 * Retorna o workspace ativo do usuário logado (baseado no cookie, com fallback
 * para o primeiro). Retorna `null` se o usuário não tiver nenhum workspace.
 */
export async function getActiveWorkspace(): Promise<ActiveWorkspace | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await getUserMemberships(session.user.id);
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const activeSlug = cookieStore.get(WORKSPACE_COOKIE)?.value;

  const active = memberships.find((m) => m.workspace.slug === activeSlug) ?? memberships[0];

  return { workspace: active.workspace, role: active.role, memberships };
}

/** Verifica se um papel tem privilégios de gestão (Owner ou Admin). */
export const canManageWorkspace = canManageWorkspaceRole;
