"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { statusSchema } from "@/lib/validations/status";

export type StatusActionState = { error?: string; success?: string; statusId?: string };

async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

async function assertStatus(statusId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.taskStatus.findFirst({
    where: { id: statusId, project: { workspaceId: active.workspace.id } },
  });
}

export async function createStatus(projectId: string, values: unknown): Promise<StatusActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };
  const parsed = statusSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const count = await db.taskStatus.count({ where: { projectId } });
  const status = await db.taskStatus.create({
    data: { name: parsed.data.name, color: parsed.data.color, projectId, order: count },
  });
  return { success: "Status criado", statusId: status.id };
}

export async function updateStatus(statusId: string, values: unknown): Promise<StatusActionState> {
  const status = await assertStatus(statusId);
  if (!status) return { error: "Status não encontrado" };
  const parsed = statusSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await db.taskStatus.update({
    where: { id: statusId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  return { success: "Status atualizado" };
}

/**
 * Exclui um status. Se houver tarefas nele, move-as para outro status do projeto.
 * Não permite excluir o último status.
 */
export async function deleteStatus(statusId: string): Promise<StatusActionState> {
  const status = await assertStatus(statusId);
  if (!status) return { error: "Status não encontrado" };

  const others = await db.taskStatus.findMany({
    where: { projectId: status.projectId, id: { not: statusId } },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (others.length === 0) {
    return { error: "O projeto precisa de ao menos um status" };
  }

  const fallbackId = others[0].id;
  await db.$transaction([
    db.task.updateMany({ where: { statusId }, data: { statusId: fallbackId } }),
    db.taskStatus.delete({ where: { id: statusId } }),
  ]);
  return { success: "Status excluído (tarefas movidas)" };
}

/** Reordena os status de um projeto pela sequência de ids (índice = order). */
export async function reorderStatuses(
  projectId: string,
  orderedIds: string[]
): Promise<StatusActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.taskStatus.updateMany({ where: { id, projectId }, data: { order: index } })
    )
  );
  return { success: "Ordem atualizada" };
}
