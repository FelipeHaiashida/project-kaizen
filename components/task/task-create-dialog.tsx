"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/lib/actions/task";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ListRef } from "@/components/task/types";

/**
 * Botão primário + diálogo para criar uma tarefa rapidamente (título + lista).
 * Ação de criação bem visível na barra da visão de Lista/Board.
 */
export function TaskCreateDialog({
  lists,
  defaultListId,
  triggerLabel = "Nova tarefa",
  triggerClassName,
}: {
  lists: ListRef[];
  defaultListId?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState(defaultListId ?? lists[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const noLists = lists.length === 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const targetList = listId || lists[0]?.id;
    if (!t || !targetList) return;
    startTransition(async () => {
      const r = await createTask(targetList, { title: t });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Tarefa criada");
        setTitle("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setListId(defaultListId ?? lists[0]?.id ?? "");
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={noLists}
          title={noLists ? "Crie uma lista primeiro" : undefined}
          className={cn(triggerClassName)}
        >
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="space-y-1.5">
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Adicione uma tarefa ao projeto.</DialogDescription>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-task-title">Título</Label>
            <Input
              id="new-task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Revisar copy da landing"
            />
          </div>
          {lists.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="new-task-list">Lista</Label>
              <select
                id="new-task-list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Criando..." : "Criar tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
