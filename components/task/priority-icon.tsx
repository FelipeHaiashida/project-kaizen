import { Flag } from "lucide-react";
import type { Priority } from "@prisma/client";

import { PRIORITY_MAP } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const p = PRIORITY_MAP[priority];
  return (
    <Flag
      className={cn("h-3.5 w-3.5", className)}
      style={{ color: p.color }}
      fill={priority === "LOW" ? "none" : p.color}
      aria-label={`Prioridade ${p.label}`}
    />
  );
}
