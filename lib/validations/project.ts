import { z } from "zod";

export const PROJECT_COLORS = [
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

export const PROJECT_ICONS = [
  "📋",
  "🚀",
  "🎯",
  "💡",
  "🛠️",
  "📈",
  "🎨",
  "🐛",
  "📚",
  "🔥",
  "✅",
  "📦",
];

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const createProjectSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(50, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  color: hexColor,
  icon: z.string().min(1).max(8),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export const updateProjectSchema = createProjectSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
