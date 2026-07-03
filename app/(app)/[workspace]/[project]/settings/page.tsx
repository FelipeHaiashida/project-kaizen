import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagManager } from "@/components/project/tag-manager";
import { CustomFieldManager } from "@/components/project/custom-field-manager";

export const metadata: Metadata = {
  title: "Configurações do projeto · Kaizen",
};

export default async function ProjectSettingsPage({
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
      tags: { orderBy: { name: "asc" }, select: { id: true, name: true, color: true } },
      customFields: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, type: true, options: true },
      },
    },
  });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/${params.workspace}/${params.project}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {project.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do projeto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tags</CardTitle>
          <CardDescription>Rótulos coloridos para organizar tarefas</CardDescription>
        </CardHeader>
        <CardContent>
          <TagManager projectId={project.id} tags={project.tags} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Campos customizados</CardTitle>
          <CardDescription>
            Campos extras por projeto (texto, número, data, dropdown, checkbox)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomFieldManager projectId={project.id} fields={project.customFields} />
        </CardContent>
      </Card>
    </div>
  );
}
