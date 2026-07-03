"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createTag, deleteTag } from "@/lib/actions/tag";
import { TAG_COLORS } from "@/lib/validations/project-meta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TagData = { id: string; name: string; color: string };

export function TagManager({ projectId, tags }: { projectId: string; tags: TagData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createTag(projectId, { name: name.trim(), color });
      if (result.error) toast.error(result.error);
      else {
        setName("");
        toast.success("Tag criada");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTag(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Tag excluída");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag ainda.</p>}
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
            <button
              onClick={() => remove(t.id)}
              disabled={isPending}
              aria-label={`Excluir tag ${t.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Nome da tag"
            className="h-9"
          />
        </div>
        <div className="flex gap-1">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2",
                color === c ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button size="sm" onClick={add} disabled={isPending}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}
