import { z } from "zod";

export const STATUS_COLORS = [
  "#6B7280",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#14B8A6",
  "#0EA5E9",
];

export const statusSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(40, "Nome muito longo"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export type StatusInput = z.infer<typeof statusSchema>;
