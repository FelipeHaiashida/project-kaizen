"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Priority } from "@prisma/client";

import { updateTask, deleteTask, createTask, setTaskStatus } from "@/lib/actions/task";
import { setTaskTags } from "@/lib/actions/tag";
import { setTaskFieldValue, setTaskEstimate } from "@/lib/actions/custom-field";
import { PRIORITIES } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TaskAttachments } from "@/components/task/task-attachments";
import type {
  TaskListItem,
  StatusOption,
  MemberOption,
  TagRef,
  ProjectField,
} from "@/components/task/types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TaskDetailSheet({
  task,
  listId,
  statuses,
  members,
  projectTags,
  projectFields,
  open,
  onOpenChange,
}: {
  task: TaskListItem;
  listId: string;
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectFields: ProjectField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [statusId, setStatusId] = useState(task.statusId);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assignees.map((a) => a.id));
  const [tagIds, setTagIds] = useState<string[]>(task.tags.map((t) => t.id));
  const [estimate, setEstimate] = useState(
    task.estimateHours != null ? String(task.estimateHours) : ""
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(task.fieldValues.map((v) => [v.fieldId, v.value]))
  );
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const doneStatusId = statuses[statuses.length - 1]?.id;
  const firstStatusId = statuses[0]?.id;

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function save() {
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title,
        description,
        statusId,
        priority,
        dueDate: dueDate || null,
        assigneeIds,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await setTaskTags(task.id, tagIds);
      await setTaskEstimate(task.id, estimate.trim() === "" ? null : Number(estimate));
      for (const field of projectFields) {
        await setTaskFieldValue(task.id, field.id, fieldValues[field.id] ?? null);
      }
      toast.success("Tarefa salva");
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm("Excluir esta tarefa e suas subtarefas?")) return;
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Tarefa excluída");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  function addSubtask() {
    const t = subtaskTitle.trim();
    if (!t) return;
    startTransition(async () => {
      const result = await createTask(listId, { title: t }, task.id);
      if (result.error) toast.error(result.error);
      else {
        setSubtaskTitle("");
        router.refresh();
      }
    });
  }

  function toggleSubtask(subId: string, currentStatus: string) {
    const target = currentStatus === doneStatusId ? firstStatusId : doneStatusId;
    if (!target) return;
    startTransition(async () => {
      await setTaskStatus(subId, target);
      router.refresh();
    });
  }

  function deleteSubtask(subId: string) {
    startTransition(async () => {
      await deleteTask(subId);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-none bg-transparent pr-8 text-lg font-semibold focus:outline-none"
          placeholder="Título da tarefa"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select
              className={selectClass}
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prioridade</Label>
            <select
              className={selectClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Vencimento</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Responsáveis</Label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const selected = assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleAssignee(m.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 text-xs",
                    selected ? "border-primary bg-primary/10" : "border-input"
                  )}
                >
                  <UserAvatar name={m.name} image={m.image} className="h-5 w-5 text-[10px]" />
                  {m.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {projectTags.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {projectTags.map((t) => {
                const on = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={
                      on
                        ? { backgroundColor: t.color, color: "#fff" }
                        : { color: t.color, border: `1px solid ${t.color}` }
                    }
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Estimativa (horas)</Label>
          <Input
            type="number"
            min={0}
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
          />
        </div>

        {projectFields.map((f) => (
          <div key={f.id} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{f.name}</Label>
            {f.type === "CHECKBOX" ? (
              <input
                id={`field-${f.id}`}
                type="checkbox"
                checked={fieldValues[f.id] === "true"}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [f.id]: e.target.checked ? "true" : "" }))
                }
                className="h-4 w-4"
              />
            ) : f.type === "DROPDOWN" ? (
              <select
                id={`field-${f.id}`}
                className={selectClass}
                value={fieldValues[f.id] ?? ""}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
              >
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`field-${f.id}`}
                type={f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                value={fieldValues[f.id] ?? ""}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Descrição</Label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <TaskAttachments taskId={task.id} attachments={task.attachments} />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Subtarefas ({task.subtasks.length})
          </Label>
          <ul className="space-y-1">
            {task.subtasks.map((s) => {
              const done = s.statusId === doneStatusId;
              return (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleSubtask(s.id, s.statusId)}
                    className="h-4 w-4"
                  />
                  <span className={cn("flex-1", done && "text-muted-foreground line-through")}>
                    {s.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Excluir subtarefa ${s.title}`}
                    onClick={() => deleteSubtask(s.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Input
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubtask();
              }
            }}
            placeholder="Adicionar subtarefa e pressionar Enter"
            className="h-8 text-sm"
          />
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
            Excluir
          </Button>
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
