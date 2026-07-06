"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { sprintSchema } from "@/lib/validations/sprint";

export type SprintActionState = { error?: string; success?: string; sprintId?: string };

async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

async function assertSprint(sprintId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.sprint.findFirst({
    where: { id: sprintId, project: { workspaceId: active.workspace.id } },
  });
}

export async function createSprint(
  projectId: string,
  values: unknown
): Promise<SprintActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };
  const parsed = sprintSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const sprint = await db.sprint.create({
    data: { name: parsed.data.name, color: parsed.data.color, projectId },
  });
  return { success: "Sprint criada", sprintId: sprint.id };
}

export async function updateSprint(sprintId: string, values: unknown): Promise<SprintActionState> {
  const sprint = await assertSprint(sprintId);
  if (!sprint) return { error: "Sprint não encontrada" };
  const parsed = sprintSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  await db.sprint.update({
    where: { id: sprintId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  return { success: "Sprint atualizada" };
}

/** Exclui uma sprint e remove a associação das tarefas (sprintId -> null). */
export async function deleteSprint(sprintId: string): Promise<SprintActionState> {
  const sprint = await assertSprint(sprintId);
  if (!sprint) return { error: "Sprint não encontrada" };
  await db.$transaction([
    db.task.updateMany({ where: { sprintId }, data: { sprintId: null } }),
    db.sprint.delete({ where: { id: sprintId } }),
  ]);
  return { success: "Sprint excluída" };
}

/** Define (ou limpa) a sprint de uma tarefa. */
export async function setTaskSprint(
  taskId: string,
  sprintId: string | null
): Promise<SprintActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  const task = await db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { list: { select: { projectId: true } } },
  });
  if (!task) return { error: "Tarefa não encontrada" };

  if (sprintId) {
    const sprint = await db.sprint.findFirst({
      where: { id: sprintId, projectId: task.list.projectId },
    });
    if (!sprint) return { error: "Sprint inválida" };
  }

  await db.task.update({ where: { id: taskId }, data: { sprintId: sprintId ?? null } });
  return { success: "Sprint atualizada" };
}
