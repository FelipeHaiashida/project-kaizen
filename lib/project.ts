import { db } from "@/lib/db";

/** Status padrão criados junto com um novo projeto. */
export const DEFAULT_STATUSES = [
  { name: "A Fazer", color: "#6B7280", order: 0 },
  { name: "Em Progresso", color: "#3B82F6", order: 1 },
  { name: "Em Revisão", color: "#F59E0B", order: 2 },
  { name: "Concluído", color: "#10B981", order: 3 },
];

export const DEFAULT_LIST_NAME = "Tarefas";

/** Projetos de um workspace (não arquivados por padrão). */
export function getWorkspaceProjects(workspaceId: string, includeArchived = true) {
  return db.project.findMany({
    where: { workspaceId, ...(includeArchived ? {} : { archived: false }) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      archived: true,
      visibility: true,
    },
  });
}

/** Busca um projeto garantindo que pertence ao workspace informado. */
export async function getProjectForWorkspace(projectId: string, workspaceId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  return project;
}
