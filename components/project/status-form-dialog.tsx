"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { statusSchema, STATUS_COLORS, type StatusInput } from "@/lib/validations/status";
import { createStatus, updateStatus } from "@/lib/actions/status";
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

interface Props {
  mode: "create" | "edit";
  projectId: string;
  statusId?: string;
  initial?: StatusInput;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StatusFormDialog({
  mode,
  projectId,
  statusId,
  initial,
  trigger,
  open,
  onOpenChange,
}: Props) {
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
  } = useForm<StatusInput>({
    resolver: zodResolver(statusSchema),
    defaultValues: { name: initial?.name ?? "", color: initial?.color ?? STATUS_COLORS[0] },
  });

  const color = watch("color");

  function onSubmit(values: StatusInput) {
    startTransition(async () => {
      const r =
        mode === "create"
          ? await createStatus(projectId, values)
          : await updateStatus(statusId!, values);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.success ?? "Salvo");
      setOpen(false);
      if (mode === "create") reset({ name: "", color: STATUS_COLORS[0] });
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo status" : "Editar status"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="status-name">Nome</Label>
            <Input id="status-name" placeholder="Ex.: Em teste" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLORS.map((c) => (
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
