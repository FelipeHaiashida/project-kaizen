import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListsView } from "@/components/list/lists-view";
import { TasksList } from "@/components/task/tasks-list";
import type { TaskListItem } from "@/components/task/types";

export const metadata: Metadata = {
  title: "Projeto · Kaizen",
};

export default async function ProjectPage({
  params,
}: {
  params: { workspace: string; project: string };
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await db.project.findFirst({
    where: {
      id: params.project,
      workspace: { slug: params.workspace, members: { some: { userId: session.user.id } } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      icon: true,
      workspaceId: true,
      statuses: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true } },
      tags: { orderBy: { name: "asc" }, select: { id: true, name: true, color: true } },
      customFields: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, type: true, options: true },
      },
      lists: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          tasks: {
            where: { parentId: null },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              dueDate: true,
              estimateHours: true,
              statusId: true,
              status: { select: { name: true, color: true } },
              assignees: { select: { user: { select: { id: true, name: true, image: true } } } },
              tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
              fieldValues: { select: { fieldId: true, value: true } },
              subtasks: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, statusId: true },
              },
            },
          },
        },
      },
    },
  });
  if (!project) notFound();

  const memberRows = await db.workspaceMember.findMany({
    where: { workspaceId: project.workspaceId },
    select: { user: { select: { id: true, name: true, image: true } } },
  });
  const members = memberRows.map((m) => m.user);
  const statuses = project.statuses;
  const projectTags = project.tags;
  const projectFields = project.customFields;

  const lists = project.lists.map((l) => ({ id: l.id, name: l.name, color: l.color }));
  const counts: Record<string, number> = {};
  const bodies: Record<string, React.ReactNode> = {};

  for (const list of project.lists) {
    const tasks: TaskListItem[] = list.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      estimateHours: t.estimateHours,
      statusId: t.statusId,
      status: t.status,
      assignees: t.assignees.map((a) => a.user),
      tags: t.tags.map((tt) => tt.tag),
      fieldValues: t.fieldValues,
      subtasks: t.subtasks,
    }));
    counts[list.id] = tasks.length;
    bodies[list.id] = (
      <TasksList
        listId={list.id}
        tasks={tasks}
        statuses={statuses}
        members={members}
        projectTags={projectTags}
        projectFields={projectFields}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
          style={{ backgroundColor: `${project.color}20` }}
        >
          {project.icon}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Link
          href={`/${params.workspace}/${params.project}/settings`}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </div>

      <ListsView projectId={project.id} initialLists={lists} counts={counts} bodies={bodies} />
    </div>
  );
}
