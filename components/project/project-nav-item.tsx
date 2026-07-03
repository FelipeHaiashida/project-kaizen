"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { setProjectArchived, deleteProject } from "@/lib/actions/project";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFormDialog } from "@/components/project/project-form-dialog";

export type ProjectItem = {
  id: string;
  name: string;
  color: string;
  icon: string;
  archived: boolean;
  visibility: "PUBLIC" | "PRIVATE";
};

export function ProjectNavItem({
  project,
  workspaceSlug,
}: {
  project: ProjectItem;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const href = `/${workspaceSlug}/${project.id}`;
  const isActive = pathname === href;

  function onArchiveToggle() {
    startTransition(async () => {
      const result = await setProjectArchived(project.id, !project.archived);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Feito");
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!window.confirm(`Excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`))
      return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Excluído");
        if (pathname.startsWith(href)) router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs"
          style={{ backgroundColor: `${project.color}20` }}
        >
          {project.icon}
        </span>
        <span className="truncate">{project.name}</span>
        {project.visibility === "PRIVATE" && (
          <span className="text-xs text-muted-foreground">🔒</span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label={`Ações de ${project.name}`}
          className="rounded p-1 text-muted-foreground opacity-0 hover:bg-background focus:opacity-100 focus:outline-none group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onArchiveToggle}>
            {project.archived ? (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Desarquivar
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Arquivar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDialog
        mode="edit"
        workspaceSlug={workspaceSlug}
        projectId={project.id}
        initial={{
          name: project.name,
          color: project.color,
          icon: project.icon,
          visibility: project.visibility,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
      />
    </div>
  );
}
