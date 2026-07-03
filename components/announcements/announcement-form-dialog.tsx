"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  announcementSchema,
  ANNOUNCEMENT_LEVELS,
  type AnnouncementInput,
} from "@/lib/validations/announcement";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  mode: "create" | "edit";
  announcementId?: string;
  initial?: AnnouncementInput;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AnnouncementFormDialog({
  mode,
  announcementId,
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
  } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      level: initial?.level ?? "NORMAL",
      pinned: initial?.pinned ?? false,
    },
  });

  const content = watch("content");
  const pinned = watch("pinned");

  function onSubmit(values: AnnouncementInput) {
    startTransition(async () => {
      const r =
        mode === "create"
          ? await createAnnouncement(values)
          : await updateAnnouncement(announcementId!, values);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.success ?? "Salvo");
      setOpen(false);
      if (mode === "create") reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo aviso" : "Editar aviso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ann-title">Título</Label>
            <Input id="ann-title" placeholder="Título do aviso" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <RichTextEditor value={content} onChange={(html) => setValue("content", html)} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ann-level">Nível</Label>
              <select id="ann-level" className={selectClass} {...register("level")}>
                {ANNOUNCEMENT_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setValue("pinned", e.target.checked)}
                className="h-4 w-4"
              />
              Fixar no topo
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : mode === "create" ? "Publicar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
