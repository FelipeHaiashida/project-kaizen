"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteList } from "@/lib/actions/list";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFormDialog } from "@/components/list/list-form-dialog";

export type ListData = { id: string; name: string; color: string };

export function SortableListSection({
  list,
  projectId,
  count,
  children,
}: {
  list: ListData;
  projectId: string;
  count: number;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function onDelete() {
    if (!window.confirm(`Excluir a lista "${list.name}" e todas as suas tarefas?`)) return;
    startTransition(async () => {
      const result = await deleteList(list.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Excluída");
        router.refresh();
      }
    });
  }

  return (
    <section ref={setNodeRef} style={style} className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label={`Reordenar ${list.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: list.color }} />
        <h3 className="text-sm font-semibold">{list.name}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isPending}
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
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={cn("p-2")}>
        {children ?? <p className="px-1 py-2 text-xs text-muted-foreground">Nenhuma tarefa</p>}
      </div>

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
