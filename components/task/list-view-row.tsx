"use client";

import { PRIORITY_MAP } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityIcon } from "@/components/task/priority-icon";
import type { TaskViewItem, ColumnKey } from "@/components/task/types";

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ListViewRow({
  task,
  columns,
  selected,
  isDone,
  onSelect,
  onOpen,
  onToggleComplete,
}: {
  task: TaskViewItem;
  columns: Set<ColumnKey>;
  selected: boolean;
  isDone: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const overdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <div className="flex items-center gap-2 border-b px-2 py-1.5 text-sm last:border-b-0 hover:bg-accent/50">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        aria-label="Selecionar tarefa"
        className="h-4 w-4"
      />
      <input
        type="checkbox"
        checked={isDone}
        onChange={onToggleComplete}
        aria-label="Concluir tarefa"
        className="h-4 w-4"
      />
      <button
        onClick={onOpen}
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          isDone && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </button>

      {columns.has("priority") && (
        <span className="hidden w-16 shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          <PriorityIcon priority={task.priority} />
          {PRIORITY_MAP[task.priority].label}
        </span>
      )}
      {columns.has("epic") && (
        <span className="hidden w-24 shrink-0 truncate text-xs lg:block">
          {task.epic ? (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: task.epic.color }}
            >
              {task.epic.name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      )}
      {columns.has("sprint") && (
        <span className="hidden w-24 shrink-0 truncate text-xs lg:block">
          {task.sprint ? (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: task.sprint.color }}
            >
              {task.sprint.name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      )}
      {columns.has("status") && (
        <span className="hidden w-28 shrink-0 items-center gap-1 text-xs md:flex">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.status.color }} />
          {task.status.name}
        </span>
      )}
      {columns.has("assignees") && (
        <div className="hidden w-16 shrink-0 -space-x-1.5 sm:flex">
          {task.assignees.slice(0, 3).map((a) => (
            <UserAvatar
              key={a.id}
              name={a.name}
              image={a.image}
              className="h-5 w-5 border border-background text-[10px]"
            />
          ))}
        </div>
      )}
      {columns.has("dueDate") && (
        <span
          className={cn(
            "w-14 shrink-0 text-xs text-muted-foreground",
            overdue && "font-medium text-destructive"
          )}
        >
          {task.dueDate ? formatDue(task.dueDate) : "—"}
        </span>
      )}
      {columns.has("tags") && (
        <div className="hidden w-32 shrink-0 flex-wrap gap-1 lg:flex">
          {task.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full px-1.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
