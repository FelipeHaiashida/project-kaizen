import { z } from "zod";

export const TAG_COLORS = [
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#059669",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#6B7280",
];

export const tagSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(30, "Nome muito longo"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export const CUSTOM_FIELD_TYPES = [
  { value: "TEXT", label: "Texto" },
  { value: "NUMBER", label: "Número" },
  { value: "DATE", label: "Data" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
] as const;

export const customFieldSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(40, "Nome muito longo"),
  type: z.enum(["TEXT", "NUMBER", "DATE", "DROPDOWN", "CHECKBOX"]),
  options: z.array(z.string().min(1)).optional(),
});

export type TagInput = z.infer<typeof tagSchema>;
export type CustomFieldInput = z.infer<typeof customFieldSchema>;
