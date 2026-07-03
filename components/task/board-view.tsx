"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createTask, setTaskStatus } from "@/lib/actions/task";
import { setTasksOrder } from "@/lib/actions/task-bulk";
import { PRIORITY_MAP, PRIORITIES } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityIcon } from "@/components/task/priority-icon";
import { TaskDetailSheet } from "@/components/task/task-detail-sheet";
import type {
  TaskViewItem,
  StatusOption,
  MemberOption,
  TagRef,
  ProjectField,
  ListRef,
} from "@/components/task/types";

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function BoardCard({
  task,
  onOpen,
  dragging,
}: {
  task: TaskViewItem;
  onOpen?: () => void;
  dragging?: boolean;
}) {
  const p = PRIORITY_MAP[task.priority];
  return (
    <div
      onClick={onOpen}
      className={cn(
        "cursor-pointer rounded-md border bg-background p-2 text-sm shadow-sm",
        dragging && "opacity-50"
      )}
      style={{ borderLeft: `3px solid ${p.color}` }}
    >
      <p className="mb-1 line-clamp-2">{task.title}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <PriorityIcon priority={task.priority} />
        {task.dueDate && (
          <span>
            {new Date(task.dueDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        )}
        {task.subtasks.length > 0 && <span>☑ {task.subtasks.length}</span>}
        <div className="ml-auto flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <UserAvatar
              key={a.id}
              name={a.name}
              image={a.image}
              className="h-5 w-5 border border-background text-[10px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ task, onOpen }: { task: TaskViewItem; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard task={task} onOpen={onOpen} dragging={isDragging} />
    </div>
  );
}

function Column({
  status,
  taskIds,
  taskMap,
  onOpen,
  onAdd,
}: {
  status: StatusOption;
  taskIds: string[];
  taskMap: Map<string, TaskViewItem>;
  onOpen: (id: string) => void;
  onAdd: (statusId: string, title: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status.id });
  const [adding, setAdding] = useState("");

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/20">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
        <h3 className="text-sm font-semibold">{status.name}</h3>
        <span className="text-xs text-muted-foreground">{taskIds.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((id) => {
            const task = taskMap.get(id);
            if (!task) return null;
            return <SortableCard key={id} task={task} onOpen={() => onOpen(id)} />;
          })}
        </SortableContext>
        {taskIds.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">Solte tarefas aqui</p>
        )}
      </div>
      <div className="flex items-center gap-1 border-t px-2 py-1.5">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && adding.trim()) {
              e.preventDefault();
              onAdd(status.id, adding.trim());
              setAdding("");
            }
          }}
          placeholder="Adicionar tarefa"
          className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}

export function BoardView({
  lists,
  tasks,
  statuses,
  members,
  projectTags,
  projectFields,
  currentUserId,
}: {
  projectId: string;
  lists: ListRef[];
  tasks: TaskViewItem[];
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectFields: ProjectField[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [fAssignee, setFAssignee] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fTag, setFTag] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const firstListId = lists[0]?.id;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const filteredSorted = useMemo(() => {
    return tasks
      .filter((t) => {
        if (fAssignee && !t.assignees.some((a) => a.id === fAssignee)) return false;
        if (fPriority && t.priority !== fPriority) return false;
        if (fTag && !t.tags.some((tg) => tg.id === fTag)) return false;
        return true;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [tasks, fAssignee, fPriority, fTag]);

  const buildItems = () => {
    const map: Record<string, string[]> = {};
    for (const s of statuses) map[s.id] = [];
    for (const t of filteredSorted) if (map[t.statusId]) map[t.statusId].push(t.id);
    return map;
  };
  const [items, setItems] = useState<Record<string, string[]>>(buildItems);

  useEffect(() => {
    setItems(buildItems());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, fAssignee, fPriority, fTag]);

  function findContainer(id: string): string | undefined {
    if (id in items) return id;
    return Object.keys(items).find((key) => items[key].includes(id));
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const overIndex = overItems.indexOf(overId);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeIdStr),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeIdStr,
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    const container = findContainer(activeIdStr);
    if (!container) return;

    // Reordena dentro da coluna final
    if (overId && overId !== activeIdStr) {
      const overContainer = findContainer(overId);
      if (overContainer === container) {
        const ids = items[container];
        const oldIndex = ids.indexOf(activeIdStr);
        const newIndex = ids.indexOf(overId);
        if (oldIndex !== newIndex) {
          setItems((prev) => ({
            ...prev,
            [container]: arrayMove(prev[container], oldIndex, newIndex),
          }));
        }
      }
    }

    const task = taskMap.get(activeIdStr);
    const targetIds = items[container];
    const persist = async () => {
      if (task && task.statusId !== container) {
        await setTaskStatus(activeIdStr, container);
      }
      await setTasksOrder(targetIds);
      router.refresh();
    };
    persist();
  }

  function addTask(statusId: string, title: string) {
    if (!firstListId) {
      toast.error("Crie uma lista primeiro");
      return;
    }
    createTask(firstListId, { title }).then(async (r) => {
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.taskId) await setTaskStatus(r.taskId, statusId);
      router.refresh();
    });
  }

  const openTask = openTaskId ? taskMap.get(openTaskId) : null;
  const activeTask = activeId ? taskMap.get(activeId) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fAssignee}
          onChange={(e) => setFAssignee(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos responsáveis</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={fPriority}
          onChange={(e) => setFPriority(e.target.value)}
          className={selectClass}
        >
          <option value="">Toda prioridade</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={fTag} onChange={(e) => setFTag(e.target.value)} className={selectClass}>
          <option value="">Todas as tags</option>
          {projectTags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {statuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              taskIds={items[s.id] ?? []}
              taskMap={taskMap}
              onOpen={setOpenTaskId}
              onAdd={addTask}
            />
          ))}
        </div>
        <DragOverlay>{activeTask ? <BoardCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>

      {openTask && (
        <TaskDetailSheet
          task={openTask}
          listId={openTask.listId}
          statuses={statuses}
          members={members}
          projectTags={projectTags}
          projectFields={projectFields}
          currentUserId={currentUserId}
          open={!!openTask}
          onOpenChange={(o) => !o && setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
