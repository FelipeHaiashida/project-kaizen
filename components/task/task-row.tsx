"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityIcon } from "@/components/task/priority-icon";
import { TaskDetailSheet } from "@/components/task/task-detail-sheet";
import type { TaskListItem, StatusOption, MemberOption } from "@/components/task/types";

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function TaskRow({
  task,
  listId,
  statuses,
  members,
}: {
  task: TaskListItem;
  listId: string;
  statuses: StatusOption[];
  members: MemberOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
      >
        <PriorityIcon priority={task.priority} />
        <span className="min-w-0 flex-1 truncate">{task.title}</span>

        {task.subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">☑ {task.subtasks.length}</span>
        )}

        {task.dueDate && (
          <span className="text-xs text-muted-foreground">{formatDue(task.dueDate)}</span>
        )}

        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <UserAvatar
              key={a.id}
              name={a.name}
              image={a.image}
              className="h-5 w-5 border border-background text-[10px]"
            />
          ))}
        </div>

        <span
          className={cn("h-2 w-2 shrink-0 rounded-full")}
          style={{ backgroundColor: task.status.color }}
          title={task.status.name}
        />
      </button>

      {open && (
        <TaskDetailSheet
          task={task}
          listId={listId}
          statuses={statuses}
          members={members}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
