"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { DEFAULT_STATUSES, DEFAULT_LIST_NAME } from "@/lib/project";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";

export type ProjectActionState = { error?: string; success?: string; projectId?: string };

/** Cria um projeto no workspace ativo com status e lista padrão. */
export async function createProject(values: unknown): Promise<ProjectActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };

  const parsed = createProjectSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { name, description, color, icon, visibility } = parsed.data;

  const project = await db.project.create({
    data: {
      name,
      description: description || null,
      color,
      icon,
      visibility,
      workspaceId: active.workspace.id,
      statuses: { create: DEFAULT_STATUSES },
      lists: { create: { name: DEFAULT_LIST_NAME, order: 0 } },
    },
  });

  revalidatePath("/", "layout");
  return { success: "Projeto criado", projectId: project.id };
}

/** Edita nome, descrição, cor, ícone e visibilidade de um projeto do workspace ativo. */
export async function updateProject(
  projectId: string,
  values: unknown
): Promise<ProjectActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: active.workspace.id },
  });
  if (!project) return { error: "Projeto não encontrado" };

  const parsed = updateProjectSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { name, description, color, icon, visibility } = parsed.data;

  await db.project.update({
    where: { id: projectId },
    data: { name, description: description || null, color, icon, visibility },
  });

  revalidatePath("/", "layout");
  return { success: "Projeto atualizado" };
}

/** Arquiva ou desarquiva um projeto. */
export async function setProjectArchived(
  projectId: string,
  archived: boolean
): Promise<ProjectActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: active.workspace.id },
  });
  if (!project) return { error: "Projeto não encontrado" };

  await db.project.update({ where: { id: projectId }, data: { archived } });
  revalidatePath("/", "layout");
  return { success: archived ? "Projeto arquivado" : "Projeto desarquivado" };
}

/** Exclui um projeto e todas as suas dependências (transação com cascata manual). */
export async function deleteProject(projectId: string): Promise<ProjectActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: active.workspace.id },
  });
  if (!project) return { error: "Projeto não encontrado" };

  const taskFilter = { list: { projectId } };
  await db.$transaction([
    db.taskAssignee.deleteMany({ where: { task: taskFilter } }),
    db.taskTag.deleteMany({ where: { task: taskFilter } }),
    db.attachment.deleteMany({ where: { task: taskFilter } }),
    db.commentReaction.deleteMany({ where: { comment: { task: taskFilter } } }),
    db.comment.deleteMany({ where: { task: taskFilter } }),
    db.notification.deleteMany({ where: { task: taskFilter } }),
    db.task.deleteMany({ where: { list: { projectId } } }),
    db.list.deleteMany({ where: { projectId } }),
    db.taskStatus.deleteMany({ where: { projectId } }),
    db.tag.deleteMany({ where: { projectId } }),
    db.customField.deleteMany({ where: { projectId } }),
    db.project.delete({ where: { id: projectId } }),
  ]);

  revalidatePath("/", "layout");
  return { success: "Projeto excluído" };
}
