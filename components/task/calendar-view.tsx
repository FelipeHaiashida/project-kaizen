"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/lib/actions/task";
import { PRIORITY_MAP } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskDetailSheet } from "@/components/task/task-detail-sheet";
import type {
  TaskViewItem,
  StatusOption,
  MemberOption,
  TagRef,
  EpicRef,
  ProjectField,
  ListRef,
} from "@/components/task/types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CalendarView({
  lists,
  tasks,
  projectId,
  statuses,
  members,
  projectTags,
  projectEpics,
  projectFields,
  currentUserId,
}: {
  projectId: string;
  lists: ListRef[];
  tasks: TaskViewItem[];
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectEpics: EpicRef[];
  projectFields: ProjectField[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [{ year, month }, setYM] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState("");

  const firstListId = lists[0]?.id;

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskViewItem[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  const noDate = useMemo(() => tasks.filter((t) => !t.dueDate), [tasks]);

  const gridDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  function prevMonth() {
    setYM((s) => (s.month === 0 ? { year: s.year - 1, month: 11 } : { ...s, month: s.month - 1 }));
  }
  function nextMonth() {
    setYM((s) => (s.month === 11 ? { year: s.year + 1, month: 0 } : { ...s, month: s.month + 1 }));
  }

  function submitCreate() {
    if (!createTitle.trim() || !createDate || !firstListId) return;
    startTransition(async () => {
      const r = await createTask(firstListId, { title: createTitle.trim(), dueDate: createDate });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Tarefa criada");
        setCreateTitle("");
        setCreateDate(null);
        router.refresh();
      }
    });
  }

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-40 text-center text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="bg-muted/50 py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {w}
            </div>
          ))}
          {gridDays.map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === month;
            const dayTasks = tasksByDay.get(key) ?? [];
            return (
              <div
                key={key}
                onClick={() => setCreateDate(key)}
                className={cn(
                  "min-h-24 cursor-pointer bg-background p-1 text-left align-top hover:bg-accent/40",
                  !inMonth && "bg-muted/20 text-muted-foreground"
                )}
              >
                <div className="mb-1 text-xs">{d.getDate()}</div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTaskId(t.id);
                      }}
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] text-white"
                      style={{ backgroundColor: PRIORITY_MAP[t.priority].color }}
                    >
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-56">
        <h3 className="mb-2 text-sm font-semibold">Sem data ({noDate.length})</h3>
        <div className="space-y-1">
          {noDate.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpenTaskId(t.id)}
              className="flex w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs hover:bg-accent"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PRIORITY_MAP[t.priority].color }}
              />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
          {noDate.length === 0 && (
            <p className="text-xs text-muted-foreground">Todas as tarefas têm data.</p>
          )}
        </div>
      </aside>

      {/* Modal de criação com data pré-preenchida */}
      <Dialog open={!!createDate} onOpenChange={(o) => !o && setCreateDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Nova tarefa {createDate && `em ${createDate.split("-").reverse().join("/")}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cal-title">Título</Label>
              <Input
                id="cal-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                placeholder="O que precisa ser feito?"
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={submitCreate} disabled={isPending || !firstListId}>
                {isPending ? "Criando..." : "Criar tarefa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {openTask && (
        <TaskDetailSheet
          task={openTask}
          listId={openTask.listId}
          statuses={statuses}
          members={members}
          projectTags={projectTags}
          projectEpics={projectEpics}
          projectFields={projectFields}
          projectId={projectId}
          currentUserId={currentUserId}
          open={!!openTask}
          onOpenChange={(o) => !o && setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
