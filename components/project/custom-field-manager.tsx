"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createCustomField, deleteCustomField } from "@/lib/actions/custom-field";
import { CUSTOM_FIELD_TYPES } from "@/lib/validations/project-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FieldData = { id: string; name: string; type: string; options: string[] };

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CUSTOM_FIELD_TYPES.map((t) => [t.value, t.label])
);

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CustomFieldManager({
  projectId,
  fields,
}: {
  projectId: string;
  fields: FieldData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState("TEXT");
  const [optionsText, setOptionsText] = useState("");

  function add() {
    if (!name.trim()) return;
    const options =
      type === "DROPDOWN"
        ? optionsText
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    startTransition(async () => {
      const result = await createCustomField(projectId, { name: name.trim(), type, options });
      if (result.error) toast.error(result.error);
      else {
        setName("");
        setOptionsText("");
        toast.success("Campo criado");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCustomField(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Campo excluído");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum campo customizado ainda.</p>
        )}
        {fields.map((f) => (
          <li key={f.id} className="flex items-center gap-2 py-2 text-sm">
            <span className="flex-1 font-medium">{f.name}</span>
            <span className="text-xs text-muted-foreground">
              {TYPE_LABEL[f.type] ?? f.type}
              {f.type === "DROPDOWN" && f.options.length > 0 && ` (${f.options.join(", ")})`}
            </span>
            <button
              onClick={() => remove(f.id)}
              disabled={isPending}
              aria-label={`Excluir campo ${f.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do campo"
          className="h-9 w-40"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          {CUSTOM_FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {type === "DROPDOWN" && (
          <Input
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder="Opções separadas por vírgula"
            className="h-9 w-56"
          />
        )}
        <Button size="sm" onClick={add} disabled={isPending}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}
