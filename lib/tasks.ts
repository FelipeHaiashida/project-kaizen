import type { Priority } from "@prisma/client";

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "URGENT", label: "Urgente", color: "#DC2626" },
  { value: "HIGH", label: "Alta", color: "#EA580C" },
  { value: "NORMAL", label: "Normal", color: "#2563EB" },
  { value: "LOW", label: "Baixa", color: "#6B7280" },
];

export const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.value, p])) as Record<
  Priority,
  { value: Priority; label: string; color: string }
>;
