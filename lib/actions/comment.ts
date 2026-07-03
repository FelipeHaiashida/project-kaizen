"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { notify, extractMentionIds } from "@/lib/notifications";

export type CommentActionState = { error?: string; success?: string };

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: { name: string; image: string | null };
  reactions: { emoji: string; userId: string }[];
};

async function assertTask(taskId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { id: true },
  });
}

/** Retorna os comentários de uma tarefa (com autor e reações). */
export async function getTaskComments(taskId: string): Promise<CommentData[]> {
  const task = await assertTask(taskId);
  if (!task) return [];
  const comments = await db.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      user: { select: { name: true, image: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });
  return comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

function isEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export async function createComment(taskId: string, content: string): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  const task = await assertTask(taskId);
  if (!task) return { error: "Tarefa não encontrada" };
  if (isEmpty(content)) return { error: "Comentário vazio" };
  if (content.length > 20000) return { error: "Comentário muito longo" };

  await db.comment.create({ data: { taskId, userId: session.user.id, content } });

  // Notifica menções (@membro)
  const mentioned = extractMentionIds(content);
  if (mentioned.length > 0) {
    const author = session.user.name ?? "Alguém";
    const t = await db.task.findUnique({ where: { id: taskId }, select: { title: true } });
    for (const uid of mentioned) {
      await notify({
        userId: uid,
        type: "MENTIONED",
        message: `${author} mencionou você em "${t?.title ?? "uma tarefa"}"`,
        taskId,
        actorId: session.user.id,
      });
    }
  }
  return { success: "Comentário publicado" };
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== session.user.id) {
    return { error: "Você só pode editar seus comentários" };
  }
  if (isEmpty(content)) return { error: "Comentário vazio" };
  await db.comment.update({ where: { id: commentId }, data: { content } });
  return { success: "Comentário atualizado" };
}

export async function deleteComment(commentId: string): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== session.user.id) {
    return { error: "Você só pode excluir seus comentários" };
  }
  await db.$transaction([
    db.commentReaction.deleteMany({ where: { commentId } }),
    db.comment.delete({ where: { id: commentId } }),
  ]);
  return { success: "Comentário excluído" };
}

/** Alterna uma reação de emoji do usuário no comentário. */
export async function toggleReaction(
  commentId: string,
  emoji: string
): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) return { error: "Comentário não encontrado" };

  const existing = await db.commentReaction.findFirst({
    where: { commentId, userId: session.user.id, emoji },
  });
  if (existing) {
    await db.commentReaction.delete({ where: { id: existing.id } });
  } else {
    await db.commentReaction.create({ data: { commentId, emoji, userId: session.user.id } });
  }
  // "toca" o comentário para disparar o realtime (UPDATE na tabela Comment)
  await db.comment.update({ where: { id: commentId }, data: { updatedAt: new Date() } });
  return { success: "Reação atualizada" };
}
