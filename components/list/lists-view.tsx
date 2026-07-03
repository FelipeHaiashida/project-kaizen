"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { reorderLists } from "@/lib/actions/list";
import { Button } from "@/components/ui/button";
import { ListFormDialog } from "@/components/list/list-form-dialog";
import { SortableListSection, type ListData } from "@/components/list/sortable-list-section";

export function ListsView({
  projectId,
  initialLists,
  counts = {},
  bodies = {},
}: {
  projectId: string;
  initialLists: ListData[];
  counts?: Record<string, number>;
  bodies?: Record<string, React.ReactNode>;
}) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);

  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lists.findIndex((l) => l.id === active.id);
    const newIndex = lists.findIndex((l) => l.id === over.id);
    const next = arrayMove(lists, oldIndex, newIndex);
    setLists(next);

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

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={lists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {lists.map((list) => (
              <SortableListSection
                key={list.id}
                list={list}
                projectId={projectId}
                count={counts[list.id] ?? 0}
              >
                {bodies[list.id]}
              </SortableListSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
    </div>
  );
}
