"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createProjectSchema,
  PROJECT_COLORS,
  PROJECT_ICONS,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { createProject, updateProject } from "@/lib/actions/project";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectFormDialogProps {
  mode: "create" | "edit";
  workspaceSlug: string;
  projectId?: string;
  initial?: Partial<CreateProjectInput>;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectFormDialog({
  mode,
  workspaceSlug,
  projectId,
  initial,
  trigger,
  open,
  onOpenChange,
}: ProjectFormDialogProps) {
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
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      color: initial?.color ?? PROJECT_COLORS[0],
      icon: initial?.icon ?? PROJECT_ICONS[0],
      visibility: initial?.visibility ?? "PUBLIC",
    },
  });

  const color = watch("color");
  const icon = watch("icon");

  function onSubmit(values: CreateProjectInput) {
    startTransition(async () => {
      const result =
        mode === "create" ? await createProject(values) : await updateProject(projectId!, values);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Salvo");
      setOpen(false);
      if (mode === "create") {
        reset();
        if (result.projectId) router.push(`/${workspaceSlug}/${result.projectId}`);
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo projeto" : "Editar projeto"}</DialogTitle>
          <DialogDescription>Organize tarefas em um projeto da sua equipe.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="project-name">Nome</Label>
              <Input id="project-name" placeholder="Marketing" {...register("name")} />
            </div>
          </div>
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}

          <div className="space-y-2">
            <Label htmlFor="project-desc">Descrição (opcional)</Label>
            <Textarea id="project-desc" rows={2} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-1">
              {PROJECT_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setValue("icon", ic)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent",
                    icon === ic && "ring-2 ring-ring"
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setValue("color", c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-visibility">Visibilidade</Label>
            <select
              id="project-visibility"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("visibility")}
            >
              <option value="PUBLIC">Público (todos do workspace)</option>
              <option value="PRIVATE">Privado</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : mode === "create" ? "Criar projeto" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
