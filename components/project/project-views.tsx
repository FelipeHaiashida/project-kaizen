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
  EpicRef,
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
  projectEpics: EpicRef[];
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
      <div className="inline-flex gap-1 rounded-full bg-secondary p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                view === t.key
                  ? "bg-card font-semibold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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
