import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    select: { id: true, name: true, description: true, color: true, icon: true },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
          style={{ backgroundColor: `${project.color}20` }}
        >
          {project.icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        As tarefas deste projeto aparecerão aqui.
      </div>
    </div>
  );
}
