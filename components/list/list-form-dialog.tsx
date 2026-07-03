"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { listSchema, LIST_COLORS, type ListInput } from "@/lib/validations/list";
import { createList, updateList } from "@/lib/actions/list";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ListFormDialogProps {
  mode: "create" | "edit";
  projectId: string;
  listId?: string;
  initial?: ListInput;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ListFormDialog({
  mode,
  projectId,
  listId,
  initial,
  trigger,
  open,
  onOpenChange,
}: ListFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ListInput>({
    resolver: zodResolver(listSchema),
    defaultValues: { name: initial?.name ?? "", color: initial?.color ?? LIST_COLORS[0] },
  });

  const color = watch("color");

  function onSubmit(values: ListInput) {
    startTransition(async () => {
      const result =
        mode === "create" ? await createList(projectId, values) : await updateList(listId!, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Salvo");
      setOpen(false);
      if (mode === "create") reset({ name: "", color: LIST_COLORS[0] });
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nova lista" : "Editar lista"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="list-name">Nome</Label>
            <Input id="list-name" placeholder="Backlog" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setValue("color", c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
