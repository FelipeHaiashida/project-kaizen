"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  taskId: string | null;
  createdAt: string;
  taskPath: string | null;
};

/** Notificações do usuário logado (mais recentes) + contagem de não lidas. */
export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unread: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unread: 0 };

  await ensureDueSoonNotifications();

  const rows = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      message: true,
      read: true,
      taskId: true,
      createdAt: true,
      task: {
        select: {
          list: {
            select: { project: { select: { id: true, workspace: { select: { slug: true } } } } },
          },
        },
      },
    },
  });

  const notifications = rows.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    taskId: n.taskId,
    createdAt: n.createdAt.toISOString(),
    taskPath: n.task ? `/${n.task.list.project.workspace.slug}/${n.task.list.project.id}` : null,
  }));

  const unread = notifications.filter((n) => !n.read).length;
  return { notifications, unread };
}

export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
}

/** Cria notificações DUE_SOON para tarefas do usuário que vencem nas próximas 24h. */
export async function ensureDueSoonNotifications(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await db.task.findMany({
    where: {
      assignees: { some: { userId } },
      dueDate: { gte: now, lte: in24h },
    },
    select: { id: true, title: true },
  });

  for (const t of tasks) {
    // Evita duplicar: só cria se não houver DUE_SOON recente para esta tarefa
    const existing = await db.notification.findFirst({
      where: {
        userId,
        taskId: t.id,
        type: "DUE_SOON",
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      await notify({
        userId,
        type: "DUE_SOON",
        message: `A tarefa "${t.title}" vence em breve`,
        taskId: t.id,
      });
    }
  }
}

export type NotificationSettingsData = {
  taskAssigned: boolean;
  mentioned: boolean;
  dueSoon: boolean;
  statusChanged: boolean;
};

export async function getNotificationSettings(): Promise<NotificationSettingsData> {
  const session = await auth();
  const fallback = { taskAssigned: true, mentioned: true, dueSoon: true, statusChanged: true };
  if (!session?.user?.id) return fallback;
  const s = await db.notificationSettings.findUnique({ where: { userId: session.user.id } });
  return s ?? fallback;
}

export async function updateNotificationSettings(
  values: NotificationSettingsData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  await db.notificationSettings.upsert({
    where: { userId: session.user.id },
    update: values,
    create: { userId: session.user.id, ...values },
  });
  revalidatePath("/settings/notifications");
  return { success: "Preferências salvas" };
}
