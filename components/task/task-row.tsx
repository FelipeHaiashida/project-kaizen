"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityIcon } from "@/components/task/priority-icon";
import { TaskDetailSheet } from "@/components/task/task-detail-sheet";
import type {
  TaskListItem,
  StatusOption,
  MemberOption,
  TagRef,
  ProjectField,
} from "@/components/task/types";

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function TaskRow({
  task,
  listId,
  statuses,
  members,
  projectTags,
  projectFields,
}: {
  task: TaskListItem;
  listId: string;
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectFields: ProjectField[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
      >
        <PriorityIcon priority={task.priority} />
        <span className="min-w-0 max-w-[40%] truncate">{task.title}</span>

        {task.tags.length > 0 && (
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
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
        {task.tags.length === 0 && <span className="flex-1" />}

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
          projectTags={projectTags}
          projectFields={projectFields}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
