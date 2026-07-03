"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateWorkspaceSchema, type UpdateWorkspaceInput } from "@/lib/validations/workspace";
import { updateWorkspace } from "@/lib/actions/workspace";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkspaceSettingsFormProps {
  workspace: { name: string; slug: string; logo: string | null };
}

export function WorkspaceSettingsForm({ workspace }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: { name: workspace.name, slug: workspace.slug },
  });

  function onSubmit(values: UpdateWorkspaceInput) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    if (logoFile) formData.set("logo", logoFile);

    startTransition(async () => {
      const result = await updateWorkspace(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Workspace atualizado");
        setLogoFile(null);
        setPreview(null);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <UserAvatar
          name={watch("name") || workspace.name}
          image={preview ?? workspace.logo}
          className="h-16 w-16 rounded-md text-lg"
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setLogoFile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Trocar logo
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WEBP, GIF ou SVG (máx. 5MB)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-name">Nome</Label>
        <Input id="ws-name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-slug">Slug</Label>
        <Input id="ws-slug" {...register("slug")} />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
