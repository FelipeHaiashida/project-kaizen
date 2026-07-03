import { z } from "zod";

export const EPIC_COLORS = [
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#6B7280",
];

export const epicSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(50, "Nome muito longo"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export type EpicInput = z.infer<typeof epicSchema>;
