"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createSprint, deleteSprint } from "@/lib/actions/sprint";
import { SPRINT_COLORS } from "@/lib/validations/sprint";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SprintData = { id: string; name: string; color: string };

export function SprintManager({
  projectId,
  sprints,
}: {
  projectId: string;
  sprints: SprintData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(SPRINT_COLORS[0]);

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createSprint(projectId, { name: name.trim(), color });
      if (result.error) toast.error(result.error);
      else {
        setName("");
        toast.success("Sprint criada");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteSprint(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Sprint excluída");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sprints.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma sprint ainda.</p>
        )}
        {sprints.map((s) => (
          <span
            key={s.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: s.color }}
          >
            {s.name}
            <button
              onClick={() => remove(s.id)}
              disabled={isPending}
              aria-label={`Excluir sprint ${s.name}`}
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
            placeholder="Nome da sprint (ex.: Sprint 12)"
            className="h-9"
          />
        </div>
        <div className="flex gap-1">
          {SPRINT_COLORS.map((c) => (
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
