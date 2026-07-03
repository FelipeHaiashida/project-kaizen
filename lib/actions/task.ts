"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { notify } from "@/lib/notifications";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";

export type TaskActionState = { error?: string; success?: string; taskId?: string };

async function assertList(listId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.list.findFirst({
    where: { id: listId, project: { workspaceId: active.workspace.id } },
  });
}

async function assertTask(taskId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    include: { list: { select: { projectId: true, project: { select: { workspaceId: true } } } } },
  });
}

/** Cria uma tarefa (ou subtarefa) numa lista, com o primeiro status do projeto. */
export async function createTask(
  listId: string,
  values: unknown,
  parentId?: string
): Promise<TaskActionState> {
  const list = await assertList(listId);
  if (!list) return { error: "Lista não encontrada" };

  const parsed = createTaskSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const firstStatus = await db.taskStatus.findFirst({
    where: { projectId: list.projectId },
    orderBy: { order: "asc" },
  });
  if (!firstStatus) return { error: "Projeto sem status configurado" };

  const count = await db.task.count({ where: { listId, parentId: parentId ?? null } });
  const task = await db.task.create({
    data: {
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      listId,
      statusId: firstStatus.id,
      parentId: parentId ?? null,
      order: count,
    },
  });
  return { success: "Tarefa criada", taskId: task.id };
}

/** Atualiza os campos de uma tarefa (título, descrição, status, prioridade, vencimento, responsáveis). */
export async function updateTask(taskId: string, values: unknown): Promise<TaskActionState> {
  const task = await assertTask(taskId);
  if (!task) return { error: "Tarefa não encontrada" };

  const parsed = updateTaskSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { title, description, statusId, priority, dueDate, assigneeIds } = parsed.data;

  // Status precisa pertencer ao mesmo projeto
  const status = await db.taskStatus.findFirst({
    where: { id: statusId, projectId: task.list.projectId },
  });
  if (!status) return { error: "Status inválido" };

  // Responsáveis precisam ser membros do workspace
  let validAssignees: string[] = [];
  if (assigneeIds && assigneeIds.length > 0) {
    const members = await db.workspaceMember.findMany({
      where: { workspaceId: task.list.project.workspaceId, userId: { in: assigneeIds } },
      select: { userId: true },
    });
    validAssignees = members.map((m) => m.userId);
  }

  const session = await auth();
  const actorId = session?.user?.id;
  const before = await db.task.findUnique({
    where: { id: taskId },
    select: { statusId: true, assignees: { select: { userId: true } } },
  });
  const oldAssignees = before?.assignees.map((a) => a.userId) ?? [];

  await db.taskAssignee.deleteMany({ where: { taskId } });
  if (validAssignees.length > 0) {
    await db.taskAssignee.createMany({
      data: validAssignees.map((userId) => ({ taskId, userId })),
      skipDuplicates: true,
    });
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description || null,
      statusId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  // Notifica novos responsáveis
  const added = validAssignees.filter((id) => !oldAssignees.includes(id));
  for (const uid of added) {
    await notify({
      userId: uid,
      type: "TASK_ASSIGNED",
      message: `Você foi atribuído à tarefa "${title}"`,
      taskId,
      actorId,
    });
  }
  // Notifica mudança de status aos responsáveis
  if (before && before.statusId !== statusId) {
    for (const uid of validAssignees) {
      await notify({
        userId: uid,
        type: "STATUS_CHANGED",
        message: `"${title}" mudou para ${status.name}`,
        taskId,
        actorId,
      });
    }
  }

  return { success: "Tarefa atualizada" };
}

/** Atualiza apenas o status de uma tarefa (uso rápido, ex.: checkbox de concluir). */
export async function setTaskStatus(taskId: string, statusId: string): Promise<TaskActionState> {
  const task = await assertTask(taskId);
  if (!task) return { error: "Tarefa não encontrada" };

  const status = await db.taskStatus.findFirst({
    where: { id: statusId, projectId: task.list.projectId },
  });
  if (!status) return { error: "Status inválido" };

  const before = await db.task.findUnique({
    where: { id: taskId },
    select: { statusId: true, title: true, assignees: { select: { userId: true } } },
  });

  await db.task.update({ where: { id: taskId }, data: { statusId } });

  if (before && before.statusId !== statusId) {
    const session = await auth();
    for (const a of before.assignees) {
      await notify({
        userId: a.userId,
        type: "STATUS_CHANGED",
        message: `"${before.title}" mudou para ${status.name}`,
        taskId,
        actorId: session?.user?.id,
      });
    }
  }
  return { success: "Status atualizado" };
}

/** Exclui uma tarefa e suas subtarefas (cascata manual). */
export async function deleteTask(taskId: string): Promise<TaskActionState> {
  const task = await assertTask(taskId);
  if (!task) return { error: "Tarefa não encontrada" };

  const subtasks = await db.task.findMany({ where: { parentId: taskId }, select: { id: true } });
  const subIds = subtasks.map((s) => s.id);
  const allIds = [taskId, ...subIds];

  await db.$transaction([
    db.taskAssignee.deleteMany({ where: { taskId: { in: allIds } } }),
    db.taskTag.deleteMany({ where: { taskId: { in: allIds } } }),
    db.attachment.deleteMany({ where: { taskId: { in: allIds } } }),
    db.commentReaction.deleteMany({ where: { comment: { taskId: { in: allIds } } } }),
    db.comment.deleteMany({ where: { taskId: { in: allIds } } }),
    db.notification.deleteMany({ where: { taskId: { in: allIds } } }),
    db.task.deleteMany({ where: { id: { in: subIds } } }),
    db.task.delete({ where: { id: taskId } }),
  ]);

  return { success: "Tarefa excluída" };
}
