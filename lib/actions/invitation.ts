"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace, canManageWorkspace, WORKSPACE_COOKIE } from "@/lib/workspace";
import { sendInvitationEmail } from "@/lib/email";
import { inviteMemberSchema } from "@/lib/validations/invitation";

export type ActionState = { error?: string; success?: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** Convida alguém por email para o workspace ativo (Owner/Admin). Cria a Invitation e envia o email. */
export async function inviteMember(values: unknown): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para convidar" };

  const parsed = inviteMemberSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const email = parsed.data.email.toLowerCase();
  const { role } = parsed.data;

  // Já é membro?
  const alreadyMember = await db.workspaceMember.findFirst({
    where: { workspaceId: active.workspace.id, user: { email } },
  });
  if (alreadyMember) return { error: "Esta pessoa já é membro do workspace" };

  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  // Reaproveita convite pendente para o mesmo email, ou cria um novo.
  const pending = await db.invitation.findFirst({
    where: { workspaceId: active.workspace.id, email, acceptedAt: null },
  });

  const invitation = pending
    ? await db.invitation.update({
        where: { id: pending.id },
        data: { role, expiresAt, invitedById: session.user.id },
      })
    : await db.invitation.create({
        data: {
          email,
          role,
          expiresAt,
          workspaceId: active.workspace.id,
          invitedById: session.user.id,
        },
      });

  const origin = await getOrigin();
  const acceptUrl = `${origin}/invite/${invitation.token}`;
  const result = await sendInvitationEmail({
    to: email,
    inviterName: session.user.name ?? "Alguém",
    workspaceName: active.workspace.name,
    acceptUrl,
  });

  revalidatePath("/settings/workspace");

  if (!result.sent) {
    return {
      success: `Convite criado, mas o email não pôde ser enviado (${result.error}). Copie o link manualmente.`,
    };
  }
  return { success: `Convite enviado para ${email}` };
}

/** Cancela um convite pendente (Owner/Admin). */
export async function revokeInvitation(invitationId: string): Promise<ActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão" };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.workspaceId !== active.workspace.id) {
    return { error: "Convite não encontrado" };
  }

  await db.invitation.delete({ where: { id: invitationId } });
  revalidatePath("/settings/workspace");
  return { success: "Convite cancelado" };
}

/**
 * Aceita um convite pelo token: adiciona o usuário logado como membro, marca o
 * convite como aceito e define o workspace como ativo. Redireciona ao dashboard.
 */
export async function acceptInvitation(token: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Faça login para aceitar o convite" };

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { workspace: true },
  });
  if (!invitation) return { error: "Convite inválido" };
  if (invitation.acceptedAt) return { error: "Este convite já foi utilizado" };
  if (invitation.expiresAt < new Date()) return { error: "Este convite expirou" };

  await db.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: invitation.workspaceId } },
    update: {},
    create: { userId: session.user.id, workspaceId: invitation.workspaceId, role: invitation.role },
  });

  // Convites com email específico são de uso único; links abertos permanecem válidos.
  if (invitation.email) {
    await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, invitation.workspace.slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
