"use client";

import { useEffect, useState, useTransition } from "react";
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteStatus, reorderStatuses } from "@/lib/actions/status";
import { Button } from "@/components/ui/button";
import { StatusFormDialog } from "@/components/project/status-form-dialog";

export type StatusData = { id: string; name: string; color: string };

function SortableStatusRow({
  status,
  projectId,
  canDelete,
}: {
  status: StatusData;
  projectId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function onDelete() {
    if (!window.confirm(`Excluir o status "${status.name}"? As tarefas nele serão movidas.`))
      return;
    startTransition(async () => {
      const r = await deleteStatus(status.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.success ?? "Excluído");
        router.refresh();
      }
    });
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-md border p-2">
      <button
        className="cursor-grab text-muted-foreground"
        aria-label={`Reordenar ${status.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
      <span className="flex-1 text-sm">{status.name}</span>
      <button
        onClick={() => setEditOpen(true)}
        disabled={isPending}
        aria-label={`Editar ${status.name}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        disabled={isPending || !canDelete}
        aria-label={`Excluir ${status.name}`}
        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <StatusFormDialog
        mode="edit"
        projectId={projectId}
        statusId={status.id}
        initial={{ name: status.name, color: status.color }}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
      />
    </div>
  );
}

export function StatusManager({
  projectId,
  statuses,
}: {
  projectId: string;
  statuses: StatusData[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(statuses);

  useEffect(() => setItems(statuses), [statuses]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderStatuses(
      projectId,
      next.map((s) => s.id)
    ).then((r) => {
      if (r.error) {
        toast.error(r.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        A ordem define as colunas do Board. O último status conta como “concluído”.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => (
              <SortableStatusRow
                key={s.id}
                status={s}
                projectId={projectId}
                canDelete={items.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <StatusFormDialog
        mode="create"
        projectId={projectId}
        trigger={
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Novo status
          </Button>
        }
      />
    </div>
  );
}
