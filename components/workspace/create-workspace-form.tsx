"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createWorkspaceSchema,
  slugify,
  type CreateWorkspaceInput,
} from "@/lib/validations/workspace";
import { createWorkspace } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateWorkspaceForm() {
  const [isPending, startTransition] = useTransition();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const slugEdited = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited.current) {
      setValue("slug", slugify(e.target.value), { shouldValidate: true });
    }
  }

  function onSubmit(values: CreateWorkspaceInput) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    if (logoFile) formData.set("logo", logoFile);

    startTransition(async () => {
      const result = await createWorkspace(formData);
      // Sucesso redireciona no servidor; só chega aqui em caso de erro.
      if (result?.error) toast.error(result.error);
    });
  }

  const nameField = register("name");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nome do workspace</Label>
        <Input
          id="name"
          placeholder="Minha Equipe"
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e);
            onNameChange(e);
          }}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (identificador único)</Label>
        <Input
          id="slug"
          placeholder="minha-equipe"
          {...register("slug", { onChange: () => (slugEdited.current = true) })}
        />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (opcional)</Label>
        <Input
          id="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando..." : "Criar workspace"}
      </Button>
    </form>
  );
}
