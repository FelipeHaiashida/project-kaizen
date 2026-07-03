"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { epicSchema } from "@/lib/validations/epic";

export type EpicActionState = { error?: string; success?: string; epicId?: string };

async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

async function assertEpic(epicId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.epic.findFirst({
    where: { id: epicId, project: { workspaceId: active.workspace.id } },
  });
}

export async function createEpic(projectId: string, values: unknown): Promise<EpicActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };
  const parsed = epicSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const epic = await db.epic.create({
    data: { name: parsed.data.name, color: parsed.data.color, projectId },
  });
  return { success: "Épico criado", epicId: epic.id };
}

export async function updateEpic(epicId: string, values: unknown): Promise<EpicActionState> {
  const epic = await assertEpic(epicId);
  if (!epic) return { error: "Épico não encontrado" };
  const parsed = epicSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  await db.epic.update({
    where: { id: epicId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  return { success: "Épico atualizado" };
}

/** Exclui um épico e remove a associação das tarefas (epicId -> null). */
export async function deleteEpic(epicId: string): Promise<EpicActionState> {
  const epic = await assertEpic(epicId);
  if (!epic) return { error: "Épico não encontrado" };
  await db.$transaction([
    db.task.updateMany({ where: { epicId }, data: { epicId: null } }),
    db.epic.delete({ where: { id: epicId } }),
  ]);
  return { success: "Épico excluído" };
}

/** Define (ou limpa) o épico de uma tarefa. */
export async function setTaskEpic(taskId: string, epicId: string | null): Promise<EpicActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  const task = await db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { list: { select: { projectId: true } } },
  });
  if (!task) return { error: "Tarefa não encontrada" };

  if (epicId) {
    const epic = await db.epic.findFirst({ where: { id: epicId, projectId: task.list.projectId } });
    if (!epic) return { error: "Épico inválido" };
  }

  await db.task.update({ where: { id: taskId }, data: { epicId: epicId ?? null } });
  return { success: "Épico atualizado" };
}
