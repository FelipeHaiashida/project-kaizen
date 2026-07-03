"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createEpic, deleteEpic } from "@/lib/actions/epic";
import { EPIC_COLORS } from "@/lib/validations/epic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EpicData = { id: string; name: string; color: string };

export function EpicManager({ projectId, epics }: { projectId: string; epics: EpicData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(EPIC_COLORS[0]);

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createEpic(projectId, { name: name.trim(), color });
      if (result.error) toast.error(result.error);
      else {
        setName("");
        toast.success("Épico criado");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteEpic(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Épico excluído");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {epics.length === 0 && <p className="text-sm text-muted-foreground">Nenhum épico ainda.</p>}
        {epics.map((e) => (
          <span
            key={e.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: e.color }}
          >
            {e.name}
            <button
              onClick={() => remove(e.id)}
              disabled={isPending}
              aria-label={`Excluir épico ${e.name}`}
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
            placeholder="Nome do épico"
            className="h-9"
          />
        </div>
        <div className="flex gap-1">
          {EPIC_COLORS.map((c) => (
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
