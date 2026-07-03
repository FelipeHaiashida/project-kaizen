"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { tagSchema } from "@/lib/validations/project-meta";

export type TagActionState = { error?: string; success?: string; tagId?: string };

async function assertProject(projectId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.project.findFirst({ where: { id: projectId, workspaceId: active.workspace.id } });
}

async function assertTag(tagId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.tag.findFirst({
    where: { id: tagId, project: { workspaceId: active.workspace.id } },
  });
}

export async function createTag(projectId: string, values: unknown): Promise<TagActionState> {
  const project = await assertProject(projectId);
  if (!project) return { error: "Projeto não encontrado" };
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const tag = await db.tag.create({
    data: { name: parsed.data.name, color: parsed.data.color, projectId },
  });
  return { success: "Tag criada", tagId: tag.id };
}

export async function updateTag(tagId: string, values: unknown): Promise<TagActionState> {
  const tag = await assertTag(tagId);
  if (!tag) return { error: "Tag não encontrada" };
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  await db.tag.update({
    where: { id: tagId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  return { success: "Tag atualizada" };
}

export async function deleteTag(tagId: string): Promise<TagActionState> {
  const tag = await assertTag(tagId);
  if (!tag) return { error: "Tag não encontrada" };
  await db.$transaction([
    db.taskTag.deleteMany({ where: { tagId } }),
    db.tag.delete({ where: { id: tagId } }),
  ]);
  return { success: "Tag excluída" };
}

/** Define o conjunto de tags de uma tarefa. */
export async function setTaskTags(taskId: string, tagIds: string[]): Promise<TagActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };
  const task = await db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { list: { select: { projectId: true } } },
  });
  if (!task) return { error: "Tarefa não encontrada" };

  // Só tags do mesmo projeto
  const validTags = await db.tag.findMany({
    where: { id: { in: tagIds }, projectId: task.list.projectId },
    select: { id: true },
  });

  await db.taskTag.deleteMany({ where: { taskId } });
  if (validTags.length > 0) {
    await db.taskTag.createMany({
      data: validTags.map((t) => ({ taskId, tagId: t.id })),
      skipDuplicates: true,
    });
  }
  return { success: "Tags atualizadas" };
}
