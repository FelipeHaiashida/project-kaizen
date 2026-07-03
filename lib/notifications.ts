import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

const SETTING_FIELD: Record<NotificationType, keyof SettingsRow> = {
  TASK_ASSIGNED: "taskAssigned",
  MENTIONED: "mentioned",
  DUE_SOON: "dueSoon",
  STATUS_CHANGED: "statusChanged",
};

type SettingsRow = {
  taskAssigned: boolean;
  mentioned: boolean;
  dueSoon: boolean;
  statusChanged: boolean;
};

/**
 * Cria uma notificação para um usuário, respeitando as preferências dele.
 * Não notifica se `userId === actorId` (não notificar a si mesmo).
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  message: string;
  taskId?: string | null;
  actorId?: string;
}) {
  const { userId, type, message, taskId, actorId } = params;
  if (actorId && actorId === userId) return;

  const settings = await db.notificationSettings.findUnique({ where: { userId } });
  if (settings && settings[SETTING_FIELD[type]] === false) return;

  await db.notification.create({
    data: { userId, type, message, taskId: taskId ?? null },
  });
}

/** Extrai os ids de usuários mencionados no HTML de um comentário (TipTap Mention). */
export function extractMentionIds(html: string): string[] {
  const ids = new Set<string>();
  const re = /data-id="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return Array.from(ids);
}
