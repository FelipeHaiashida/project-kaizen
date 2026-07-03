"use client";

import { useState } from "react";
import { CalendarDays, LayoutGrid, List as ListIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { TaskListView } from "@/components/task/task-list-view";
import { BoardView } from "@/components/task/board-view";
import { CalendarView } from "@/components/task/calendar-view";
import type {
  TaskViewItem,
  StatusOption,
  MemberOption,
  TagRef,
  ProjectField,
  ListRef,
} from "@/components/task/types";

type View = "list" | "board" | "calendar";

export interface ProjectViewsProps {
  projectId: string;
  lists: ListRef[];
  tasks: TaskViewItem[];
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectFields: ProjectField[];
  currentUserId: string;
}

const TABS: { key: View; label: string; icon: typeof ListIcon }[] = [
  { key: "list", label: "Lista", icon: ListIcon },
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "calendar", label: "Calendário", icon: CalendarDays },
];

export function ProjectViews(props: ProjectViewsProps) {
  const [view, setView] = useState<View>("list");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm",
                view === t.key
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {view === "list" && <TaskListView {...props} />}
      {view === "board" && <BoardView {...props} />}
      {view === "calendar" && <CalendarView {...props} />}
    </div>
  );
}
