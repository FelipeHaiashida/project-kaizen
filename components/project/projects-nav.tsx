"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ProjectFormDialog } from "@/components/project/project-form-dialog";
import { ProjectNavItem, type ProjectItem } from "@/components/project/project-nav-item";

export function ProjectsNav({
  projects,
  workspaceSlug,
}: {
  projects: ProjectItem[];
  workspaceSlug: string;
}) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { active, archived } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: ProjectItem) => !q || p.name.toLowerCase().includes(q);
    return {
      active: projects.filter((p) => !p.archived && match(p)),
      archived: projects.filter((p) => p.archived && match(p)),
    };
  }, [projects, query]);

  return (
    <div className="space-y-2 pt-1.5">
      <div className="flex items-center justify-between px-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-sidebar-muted">
          Projetos
        </span>
        <ProjectFormDialog
          mode="create"
          workspaceSlug={workspaceSlug}
          trigger={
            <button
              aria-label="Novo projeto"
              className="rounded p-0.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          }
        />
      </div>

      <div className="relative px-2">
        <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar projetos"
          className="h-8 border-sidebar-accent bg-sidebar-accent/50 pl-7 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus-visible:ring-sidebar-active"
        />
      </div>

      <div className="space-y-0.5">
        {active.length === 0 && (
          <p className="px-2 py-1 text-xs text-sidebar-muted">
            {query ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
          </p>
        )}
        {active.map((p) => (
          <ProjectNavItem key={p.id} project={p} workspaceSlug={workspaceSlug} />
        ))}
      </div>

      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center gap-1 px-2 py-1 text-xs font-medium text-sidebar-muted hover:text-sidebar-foreground"
          >
            {showArchived ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Arquivados ({archived.length})
          </button>
          {showArchived && (
            <div className={cn("space-y-0.5")}>
              {archived.map((p) => (
                <ProjectNavItem key={p.id} project={p} workspaceSlug={workspaceSlug} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
