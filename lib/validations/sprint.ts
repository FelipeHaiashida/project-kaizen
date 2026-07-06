import { z } from "zod";

export const SPRINT_COLORS = [
  "#5C7A52",
  "#2563EB",
  "#0891B2",
  "#7C3AED",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#6B7280",
];

export const sprintSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(50, "Nome muito longo"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export type SprintInput = z.infer<typeof sprintSchema>;
