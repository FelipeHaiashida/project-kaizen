"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/lib/actions/task";

export function InlineTaskCreate({ listId }: { listId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const t = title.trim();
    if (!t) return;
    startTransition(async () => {
      const result = await createTask(listId, { title: t });
      if (result.error) toast.error(result.error);
      else {
        setTitle("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-1 px-1">
      <Plus className="h-4 w-4 text-muted-foreground" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        disabled={isPending}
        placeholder="Adicionar tarefa e pressionar Enter"
        className="w-full bg-transparent py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
