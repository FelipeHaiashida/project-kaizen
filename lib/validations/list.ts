import { z } from "zod";

export const LIST_COLORS = [
  "#6B7280",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
];

export const listSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(50, "Nome muito longo"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export type ListInput = z.infer<typeof listSchema>;
