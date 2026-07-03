"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";

export type BulkActionState = { error?: string; success?: string };

/** Retorna os taskIds que pertencem ao workspace ativo (filtro de segurança). */
async function scopeTasks(taskIds: string[]) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  const tasks = await db.task.findMany({
    where: {
      id: { in: taskIds },
      list: { project: { workspaceId: active.workspace.id } },
    },
    select: { id: true, list: { select: { projectId: true } } },
  });
  return { active, tasks };
}

export async function bulkSetStatus(taskIds: string[], statusId: string): Promise<BulkActionState> {
  const scoped = await scopeTasks(taskIds);
  if (!scoped) return { error: "Nenhum workspace ativo" };
  const ids = scoped.tasks.map((t) => t.id);
  if (ids.length === 0) return { error: "Nenhuma tarefa válida" };

  const projectIds = Array.from(new Set(scoped.tasks.map((t) => t.list.projectId)));
  const status = await db.taskStatus.findFirst({
    where: { id: statusId, projectId: { in: projectIds } },
  });
  if (!status) return { error: "Status inválido" };

  await db.task.updateMany({ where: { id: { in: ids } }, data: { statusId } });
  return { success: "Status atualizado" };
}

export async function bulkMove(taskIds: string[], listId: string): Promise<BulkActionState> {
  const scoped = await scopeTasks(taskIds);
  if (!scoped) return { error: "Nenhum workspace ativo" };
  const ids = scoped.tasks.map((t) => t.id);
  if (ids.length === 0) return { error: "Nenhuma tarefa válida" };

  const list = await db.list.findFirst({
    where: { id: listId, project: { workspaceId: scoped.active.workspace.id } },
  });
  if (!list) return { error: "Lista inválida" };

  await db.task.updateMany({ where: { id: { in: ids } }, data: { listId } });
  return { success: "Tarefas movidas" };
}

/** Define a ordem das tarefas pela sequência de ids (índice = order). */
export async function setTasksOrder(orderedIds: string[]): Promise<BulkActionState> {
  const scoped = await scopeTasks(orderedIds);
  if (!scoped) return { error: "Nenhum workspace ativo" };
  const validIds = new Set(scoped.tasks.map((t) => t.id));
  const ops = orderedIds
    .filter((id) => validIds.has(id))
    .map((id, index) => db.task.update({ where: { id }, data: { order: index } }));
  if (ops.length > 0) await db.$transaction(ops);
  return { success: "Ordem atualizada" };
}

export async function bulkDelete(taskIds: string[]): Promise<BulkActionState> {
  const scoped = await scopeTasks(taskIds);
  if (!scoped) return { error: "Nenhum workspace ativo" };
  const ids = scoped.tasks.map((t) => t.id);
  if (ids.length === 0) return { error: "Nenhuma tarefa válida" };

  // Inclui subtarefas das tarefas selecionadas
  const subtasks = await db.task.findMany({
    where: { parentId: { in: ids } },
    select: { id: true },
  });
  const allIds = [...ids, ...subtasks.map((s) => s.id)];

  await db.$transaction([
    db.taskAssignee.deleteMany({ where: { taskId: { in: allIds } } }),
    db.taskTag.deleteMany({ where: { taskId: { in: allIds } } }),
    db.customFieldValue.deleteMany({ where: { taskId: { in: allIds } } }),
    db.attachment.deleteMany({ where: { taskId: { in: allIds } } }),
    db.commentReaction.deleteMany({ where: { comment: { taskId: { in: allIds } } } }),
    db.comment.deleteMany({ where: { taskId: { in: allIds } } }),
    db.notification.deleteMany({ where: { taskId: { in: allIds } } }),
    db.task.deleteMany({ where: { parentId: { in: ids } } }),
    db.task.deleteMany({ where: { id: { in: ids } } }),
  ]);
  return { success: `${ids.length} tarefa(s) excluída(s)` };
}
