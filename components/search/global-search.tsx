"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CheckSquare, Clock, FileText, FolderKanban, Plus, Search, User } from "lucide-react";

import { searchGlobal, type SearchResults } from "@/lib/actions/search";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const RECENT_KEY = "kaizen.recentSearches";
const EMPTY: SearchResults = { tasks: [], projects: [], members: [] };

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent";

export function GlobalSearch({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: { id: string; name: string; icon: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [recent, setRecent] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      try {
        setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      } catch {
        setRecent([]);
      }
    } else {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await searchGlobal(query);
      setResults(r);
    }, 200);
  }, [query]);

  const saveRecent = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const next = [term, ...prev.filter((x) => x !== term)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  function go(path: string) {
    saveRecent(query);
    setOpen(false);
    router.push(path);
  }

  const hasResults =
    results.tasks.length > 0 || results.projects.length > 0 || results.members.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden rounded border bg-muted px-1 text-[10px] sm:inline">Ctrl K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Buscar tarefas, projetos, membros..."
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-1">
              {query.trim() && !hasResults && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado
                </Command.Empty>
              )}

              {!query.trim() && (
                <>
                  {recent.length > 0 && (
                    <Command.Group heading="Buscas recentes">
                      {recent.map((r) => (
                        <Command.Item
                          key={r}
                          value={`recent-${r}`}
                          onSelect={() => setQuery(r)}
                          className={itemClass}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {r}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                  <Command.Group heading="Ações rápidas">
                    <Command.Item
                      value="action-dashboard"
                      onSelect={() => go("/dashboard")}
                      className={itemClass}
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Ir para o Dashboard
                    </Command.Item>
                    {projects[0] && (
                      <Command.Item
                        value="action-create-task"
                        onSelect={() => go(`/${workspaceSlug}/${projects[0].id}`)}
                        className={itemClass}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        Criar tarefa em {projects[0].name}
                      </Command.Item>
                    )}
                    {projects.slice(0, 4).map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`goproject-${p.id}`}
                        onSelect={() => go(`/${workspaceSlug}/${p.id}`)}
                        className={itemClass}
                      >
                        <span className="text-base leading-none">{p.icon}</span>
                        Ir para {p.name}
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}

              {results.tasks.length > 0 && (
                <Command.Group heading="Tarefas">
                  {results.tasks.map((t) => (
                    <Command.Item
                      key={t.id}
                      value={`task-${t.id}`}
                      onSelect={() => go(`/${workspaceSlug}/${t.projectId}`)}
                      className={itemClass}
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{t.projectName}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.projects.length > 0 && (
                <Command.Group heading="Projetos">
                  {results.projects.map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`proj-${p.id}`}
                      onSelect={() => go(`/${workspaceSlug}/${p.id}`)}
                      className={itemClass}
                    >
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base leading-none">{p.icon}</span>
                      {p.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.members.length > 0 && (
                <Command.Group heading="Membros">
                  {results.members.map((m) => (
                    <Command.Item
                      key={m.id}
                      value={`member-${m.id}`}
                      onSelect={() => go("/settings/workspace")}
                      className={itemClass}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.email}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
