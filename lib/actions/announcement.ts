"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveWorkspace, canManageWorkspace } from "@/lib/workspace";
import { notify } from "@/lib/notifications";
import { announcementSchema } from "@/lib/validations/announcement";

export type AnnouncementActionState = { error?: string; success?: string };

export type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  level: string;
  pinned: boolean;
  createdAt: string;
  author: { name: string; image: string | null };
  read: boolean;
};

/** Avisos do workspace ativo, com status de leitura do usuário. */
export async function getAnnouncements(): Promise<AnnouncementData[]> {
  const session = await auth();
  const active = await getActiveWorkspace();
  if (!active || !session?.user?.id) return [];

  const rows = await db.announcement.findMany({
    where: { workspaceId: active.workspace.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      level: true,
      pinned: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
      reads: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    level: a.level,
    pinned: a.pinned,
    createdAt: a.createdAt.toISOString(),
    author: a.author,
    read: a.reads.length > 0,
  }));
}

/** Quantidade de avisos não lidos no workspace ativo. */
export async function getUnreadAnnouncementCount(): Promise<number> {
  const session = await auth();
  const active = await getActiveWorkspace();
  if (!active || !session?.user?.id) return 0;
  return db.announcement.count({
    where: {
      workspaceId: active.workspace.id,
      reads: { none: { userId: session.user.id } },
    },
  });
}

/** Marca todos os avisos do workspace como lidos para o usuário atual. */
export async function markAnnouncementsRead(): Promise<void> {
  const session = await auth();
  const active = await getActiveWorkspace();
  if (!active || !session?.user?.id) return;

  const unread = await db.announcement.findMany({
    where: {
      workspaceId: active.workspace.id,
      reads: { none: { userId: session.user.id } },
    },
    select: { id: true },
  });
  if (unread.length === 0) return;
  await db.announcementRead.createMany({
    data: unread.map((a) => ({ announcementId: a.id, userId: session.user.id })),
    skipDuplicates: true,
  });
  revalidatePath("/", "layout");
}

export async function createAnnouncement(values: unknown): Promise<AnnouncementActionState> {
  const session = await auth();
  const active = await getActiveWorkspace();
  if (!active || !session?.user?.id) return { error: "Não autenticado" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão para publicar avisos" };

  const parsed = announcementSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const a = await db.announcement.create({
    data: {
      ...parsed.data,
      workspaceId: active.workspace.id,
      authorId: session.user.id,
    },
  });

  // Notifica todos os membros (exceto o autor)
  const members = await db.workspaceMember.findMany({
    where: { workspaceId: active.workspace.id },
    select: { userId: true },
  });
  const author = session.user.name ?? "O gestor";
  for (const m of members) {
    await notify({
      userId: m.userId,
      type: "ANNOUNCEMENT",
      message: `${author} publicou um aviso: "${a.title}"`,
      link: "/avisos",
      actorId: session.user.id,
    });
  }

  revalidatePath("/", "layout");
  return { success: "Aviso publicado" };
}

export async function updateAnnouncement(
  id: string,
  values: unknown
): Promise<AnnouncementActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão" };

  const existing = await db.announcement.findFirst({
    where: { id, workspaceId: active.workspace.id },
  });
  if (!existing) return { error: "Aviso não encontrado" };

  const parsed = announcementSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await db.announcement.update({ where: { id }, data: parsed.data });
  revalidatePath("/", "layout");
  return { success: "Aviso atualizado" };
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  if (!canManageWorkspace(active.role)) return { error: "Sem permissão" };

  const existing = await db.announcement.findFirst({
    where: { id, workspaceId: active.workspace.id },
  });
  if (!existing) return { error: "Aviso não encontrado" };

  await db.$transaction([
    db.announcementRead.deleteMany({ where: { announcementId: id } }),
    db.announcement.delete({ where: { id } }),
  ]);
  revalidatePath("/", "layout");
  return { success: "Aviso excluído" };
}
