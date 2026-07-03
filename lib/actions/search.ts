"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";

export type SearchResults = {
  tasks: { id: string; title: string; projectId: string; projectName: string }[];
  projects: { id: string; name: string; icon: string }[];
  members: { id: string; name: string; image: string | null; email: string }[];
};

const EMPTY: SearchResults = { tasks: [], projects: [], members: [] };

export async function searchGlobal(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return EMPTY;

  const active = await getActiveWorkspace();
  if (!active) return EMPTY;
  const workspaceId = active.workspace.id;

  const [tasks, projects, members] = await Promise.all([
    db.task.findMany({
      where: { title: { contains: q, mode: "insensitive" }, list: { project: { workspaceId } } },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        list: { select: { project: { select: { id: true, name: true } } } },
      },
    }),
    db.project.findMany({
      where: { name: { contains: q, mode: "insensitive" }, workspaceId, archived: false },
      take: 5,
      select: { id: true, name: true, icon: true },
    }),
    db.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      take: 5,
      select: { user: { select: { id: true, name: true, image: true, email: true } } },
    }),
  ]);

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.list.project.id,
      projectName: t.list.project.name,
    })),
    projects,
    members: members.map((m) => m.user),
  };
}
