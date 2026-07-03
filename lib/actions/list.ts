"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { listSchema } from "@/lib/validations/list";

export type ListActionState = { error?: string; success?: string; listId?: string };

/** Confirma que o projeto pertence ao workspace ativo do usuário. */
async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

/** Confirma que a lista pertence a um projeto do workspace ativo. */
async function assertList(listId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.list.findFirst({
    where: { id: listId, project: { workspaceId: active.workspace.id } },
  });
}

export async function createList(projectId: string, values: unknown): Promise<ListActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };

  const parsed = listSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const count = await db.list.count({ where: { projectId } });
  const list = await db.list.create({
    data: { name: parsed.data.name, color: parsed.data.color, projectId, order: count },
  });
  return { success: "Lista criada", listId: list.id };
}

export async function updateList(listId: string, values: unknown): Promise<ListActionState> {
  const list = await assertList(listId);
  if (!list) return { error: "Lista não encontrada" };

  const parsed = listSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await db.list.update({
    where: { id: listId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  return { success: "Lista atualizada" };
}

/** Exclui uma lista e as tarefas dela (cascata manual). */
export async function deleteList(listId: string): Promise<ListActionState> {
  const list = await assertList(listId);
  if (!list) return { error: "Lista não encontrada" };

  const taskFilter = { listId };
  await db.$transaction([
    db.taskAssignee.deleteMany({ where: { task: taskFilter } }),
    db.taskTag.deleteMany({ where: { task: taskFilter } }),
    db.attachment.deleteMany({ where: { task: taskFilter } }),
    db.commentReaction.deleteMany({ where: { comment: { task: taskFilter } } }),
    db.comment.deleteMany({ where: { task: taskFilter } }),
    db.notification.deleteMany({ where: { task: taskFilter } }),
    db.task.deleteMany({ where: { listId } }),
    db.list.delete({ where: { id: listId } }),
  ]);
  return { success: "Lista excluída" };
}

/** Reordena as listas de um projeto pela ordem dos ids informada. */
export async function reorderLists(
  projectId: string,
  orderedIds: string[]
): Promise<ListActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.list.updateMany({ where: { id, projectId }, data: { order: index } })
    )
  );
  return { success: "Ordem atualizada" };
}
