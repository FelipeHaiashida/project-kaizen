"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpDown,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Priority } from "@prisma/client";

import { createTask, setTaskStatus } from "@/lib/actions/task";
import { deleteList, reorderLists } from "@/lib/actions/list";
import { bulkDelete, bulkMove, bulkSetStatus } from "@/lib/actions/task-bulk";
import { PRIORITIES } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFormDialog } from "@/components/list/list-form-dialog";
import { ListViewRow } from "@/components/task/list-view-row";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { TaskDetailSheet } from "@/components/task/task-detail-sheet";
import type {
  TaskViewItem,
  StatusOption,
  MemberOption,
  TagRef,
  EpicRef,
  ProjectField,
  ListRef,
  ColumnKey,
} from "@/components/task/types";

const PRIORITY_RANK: Record<Priority, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "priority", label: "Prioridade" },
  { key: "epic", label: "Épico" },
  { key: "status", label: "Status" },
  { key: "assignees", label: "Responsável" },
  { key: "dueDate", label: "Vencimento" },
  { key: "tags", label: "Tags" },
];
const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function InlineCreate({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex items-center gap-1.5 border-t px-2 py-1.5 transition-colors focus-within:bg-accent/40 hover:bg-accent/40">
      <Plus className="h-4 w-4 text-primary" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            e.preventDefault();
            onCreate(title.trim());
            setTitle("");
          }
        }}
        placeholder="Adicionar tarefa…"
        className="w-full bg-transparent text-sm font-medium text-primary placeholder:font-normal placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}

function ListGroupCard({
  list,
  projectId,
  sortable,
  children,
}: {
  list: ListRef;
  projectId: string;
  sortable: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    disabled: !sortable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-2 py-2">
        {sortable && (
          <button
            className="cursor-grab text-muted-foreground"
            aria-label={`Reordenar ${list.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: list.color }} />
        <h3 className="text-sm font-semibold">{list.name}</h3>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Ações da lista ${list.name}`}
              className="rounded p-1 text-muted-foreground hover:bg-accent focus:outline-none"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Renomear / cor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => {
                  if (!window.confirm(`Excluir a lista "${list.name}" e suas tarefas?`)) return;
                  deleteList(list.id).then((r) => {
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("Lista excluída");
                      router.refresh();
                    }
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children}
      <ListFormDialog
        mode="edit"
        projectId={projectId}
        listId={list.id}
        initial={{ name: list.name, color: list.color }}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
      />
    </section>
  );
}

export function TaskListView({
  projectId,
  lists,
  tasks,
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
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"list" | "status">("list");
  const [sortKey, setSortKey] = useState<"title" | "priority" | "dueDate" | "status">("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [fAssignee, setFAssignee] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fEpic, setFEpic] = useState("");
  const [fDue, setFDue] = useState("");
  const [columns, setColumns] = useState<Set<ColumnKey>>(new Set(ALL_COLUMNS.map((c) => c.key)));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [orderedLists, setOrderedLists] = useState(lists);

  // resync when server data changes
  useMemo(() => setOrderedLists(lists), [lists]);

  const doneStatusId = statuses[statuses.length - 1]?.id;
  const firstStatusId = statuses[0]?.id;
  const firstListId = lists[0]?.id;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (fAssignee && !t.assignees.some((a) => a.id === fAssignee)) return false;
      if (fPriority && t.priority !== fPriority) return false;
      if (fStatus && t.statusId !== fStatus) return false;
      if (fEpic && t.epic?.id !== fEpic) return false;
      if (fDue === "has" && !t.dueDate) return false;
      if (fDue === "overdue") {
        if (!t.dueDate || new Date(t.dueDate) >= now || t.statusId === doneStatusId) return false;
      }
      return true;
    });
  }, [tasks, search, fAssignee, fPriority, fStatus, fEpic, fDue, doneStatusId]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "priority") cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      else if (sortKey === "dueDate")
        cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      else if (sortKey === "status") cmp = a.status.name.localeCompare(b.status.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const groups = useMemo(() => {
    if (groupBy === "list") {
      return orderedLists.map((l) => ({
        id: l.id,
        list: l,
        tasks: sorted.filter((t) => t.listId === l.id),
      }));
    }
    return statuses.map((s) => ({
      id: s.id,
      status: s,
      tasks: sorted.filter((t) => t.statusId === s.id),
    }));
  }, [groupBy, orderedLists, statuses, sorted]);

  function toggleColumn(key: ColumnKey) {
    setColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function completeToggle(t: TaskViewItem) {
    const target = t.statusId === doneStatusId ? firstStatusId : doneStatusId;
    if (!target) return;
    setTaskStatus(t.id, target).then(() => router.refresh());
  }

  function createInGroup(group: { list?: ListRef; status?: StatusOption }, title: string) {
    if (group.list) {
      createTask(group.list.id, { title }).then((r) => {
        if (r.error) toast.error(r.error);
        else router.refresh();
      });
    } else if (group.status && firstListId) {
      createTask(firstListId, { title }).then(async (r) => {
        if (r.error) {
          toast.error(r.error);
          return;
        }
        if (r.taskId && group.status) await setTaskStatus(r.taskId, group.status.id);
        router.refresh();
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedLists.findIndex((l) => l.id === active.id);
    const newIndex = orderedLists.findIndex((l) => l.id === over.id);
    const next = arrayMove(orderedLists, oldIndex, newIndex);
    setOrderedLists(next);
    reorderLists(
      projectId,
      next.map((l) => l.id)
    ).then((r) => {
      if (r.error) {
        toast.error(r.error);
        router.refresh();
      }
    });
  }

  function runBulk(fn: Promise<{ error?: string; success?: string }>) {
    fn.then((r) => {
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.success ?? "Feito");
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;
  const selectedIds = Array.from(selected);

  const groupNodes = groups.map((g) => {
    const rows = (
      <>
        <div>
          {g.tasks.map((t) => (
            <ListViewRow
              key={t.id}
              task={t}
              columns={columns}
              selected={selected.has(t.id)}
              isDone={t.statusId === doneStatusId}
              onSelect={(c) => toggleSelect(t.id, c)}
              onOpen={() => setOpenTaskId(t.id)}
              onToggleComplete={() => completeToggle(t)}
            />
          ))}
          {g.tasks.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma tarefa</p>
          )}
        </div>
        <InlineCreate onCreate={(title) => createInGroup(g, title)} />
      </>
    );

    if ("list" in g && g.list) {
      return (
        <ListGroupCard key={g.id} list={g.list} projectId={projectId} sortable={groupBy === "list"}>
          {rows}
        </ListGroupCard>
      );
    }
    const s = (g as { status: StatusOption }).status;
    return (
      <section key={g.id} className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          <h3 className="text-sm font-semibold">{s.name}</h3>
          <span className="text-xs text-muted-foreground">{g.tasks.length}</span>
        </div>
        {rows}
      </section>
    );
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <TaskCreateDialog
          lists={lists}
          defaultListId={firstListId}
          onCreated={(id) => setOpenTaskId(id)}
        />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefas"
            className="h-8 w-48 pl-7 text-sm"
          />
        </div>

        <div className="flex rounded-md border">
          <button
            onClick={() => setGroupBy("list")}
            className={cn("px-2 py-1 text-xs", groupBy === "list" && "bg-accent font-medium")}
          >
            Lista
          </button>
          <button
            onClick={() => setGroupBy("status")}
            className={cn("px-2 py-1 text-xs", groupBy === "status" && "bg-accent font-medium")}
          >
            Status
          </button>
        </div>

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
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className={selectClass}
        >
          <option value="">Todo status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {projectEpics.length > 0 && (
          <select value={fEpic} onChange={(e) => setFEpic(e.target.value)} className={selectClass}>
            <option value="">Todo épico</option>
            {projectEpics.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name}
              </option>
            ))}
          </select>
        )}
        <select value={fDue} onChange={(e) => setFDue(e.target.value)} className={selectClass}>
          <option value="">Todo vencimento</option>
          <option value="has">Com data</option>
          <option value="overdue">Atrasadas</option>
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className={selectClass}
        >
          <option value="priority">Ordenar: Prioridade</option>
          <option value="title">Ordenar: Título</option>
          <option value="dueDate">Ordenar: Vencimento</option>
          <option value="status">Ordenar: Status</option>
        </select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
          aria-label="Inverter ordenação"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortDir === "asc" ? "↑" : "↓"}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 rounded-md border px-2 text-xs">
            Colunas
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ALL_COLUMNS.map((c) => (
              <DropdownMenuItem
                key={c.key}
                onSelect={(e) => {
                  e.preventDefault();
                  toggleColumn(c.key);
                }}
              >
                <input
                  type="checkbox"
                  checked={columns.has(c.key)}
                  readOnly
                  className="h-3.5 w-3.5"
                />
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selectedIds.length} selecionada(s)</span>
          <select
            className={selectClass}
            defaultValue=""
            onChange={(e) => e.target.value && runBulk(bulkSetStatus(selectedIds, e.target.value))}
          >
            <option value="">Alterar status…</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            defaultValue=""
            onChange={(e) => e.target.value && runBulk(bulkMove(selectedIds, e.target.value))}
          >
            <option value="">Mover para…</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(`Excluir ${selectedIds.length} tarefa(s)?`))
                runBulk(bulkDelete(selectedIds));
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            Excluir
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Limpar seleção"
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Groups */}
      {groupBy === "list" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedLists.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">{groupNodes}</div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">{groupNodes}</div>
      )}

      {groupBy === "list" && (
        <ListFormDialog
          mode="create"
          projectId={projectId}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Adicionar lista
            </Button>
          }
        />
      )}

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
