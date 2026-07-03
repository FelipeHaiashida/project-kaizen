"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { customFieldSchema } from "@/lib/validations/project-meta";

export type FieldActionState = { error?: string; success?: string; fieldId?: string };

async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

async function assertField(fieldId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.customField.findFirst({
    where: { id: fieldId, project: { workspaceId: active.workspace.id } },
  });
}

async function assertTaskInWorkspace(taskId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { id: true, list: { select: { projectId: true } } },
  });
}

export async function createCustomField(
  projectId: string,
  values: unknown
): Promise<FieldActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };
  const parsed = customFieldSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { name, type, options } = parsed.data;
  if (type === "DROPDOWN" && (!options || options.length === 0)) {
    return { error: "Dropdown precisa de ao menos uma opção" };
  }

  const count = await db.customField.count({ where: { projectId } });
  const field = await db.customField.create({
    data: {
      name,
      type,
      options: type === "DROPDOWN" ? (options ?? []) : [],
      projectId,
      order: count,
    },
  });
  return { success: "Campo criado", fieldId: field.id };
}

export async function deleteCustomField(fieldId: string): Promise<FieldActionState> {
  const field = await assertField(fieldId);
  if (!field) return { error: "Campo não encontrado" };
  await db.$transaction([
    db.customFieldValue.deleteMany({ where: { fieldId } }),
    db.customField.delete({ where: { id: fieldId } }),
  ]);
  return { success: "Campo excluído" };
}

/** Define (ou limpa) o valor de um campo customizado numa tarefa. */
export async function setTaskFieldValue(
  taskId: string,
  fieldId: string,
  value: string | null
): Promise<FieldActionState> {
  const task = await assertTaskInWorkspace(taskId);
  if (!task) return { error: "Tarefa não encontrada" };
  const field = await db.customField.findFirst({
    where: { id: fieldId, projectId: task.list.projectId },
  });
  if (!field) return { error: "Campo inválido" };

  if (value === null || value === "") {
    await db.customFieldValue.deleteMany({ where: { fieldId, taskId } });
  } else {
    await db.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      update: { value },
      create: { fieldId, taskId, value },
    });
  }
  return { success: "Valor atualizado" };
}

/** Estimativa de horas (campo padrão da tarefa). */
export async function setTaskEstimate(
  taskId: string,
  hours: number | null
): Promise<FieldActionState> {
  const task = await assertTaskInWorkspace(taskId);
  if (!task) return { error: "Tarefa não encontrada" };
  await db.task.update({
    where: { id: taskId },
    data: { estimateHours: hours != null && hours >= 0 ? Math.floor(hours) : null },
  });
  return { success: "Estimativa atualizada" };
}
