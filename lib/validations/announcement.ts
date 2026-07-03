import { z } from "zod";

export const ANNOUNCEMENT_LEVELS = [
  { value: "NORMAL", label: "Normal", color: "#6B7280" },
  { value: "IMPORTANT", label: "Importante", color: "#CA8A04" },
  { value: "URGENT", label: "Urgente", color: "#DC2626" },
] as const;

export const LEVEL_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  ANNOUNCEMENT_LEVELS.map((l) => [l.value, { label: l.label, color: l.color }])
);

export const announcementSchema = z.object({
  title: z.string().min(1, "Informe um título").max(120, "Título muito longo"),
  content: z.string().min(1, "Escreva o conteúdo").max(20000, "Conteúdo muito longo"),
  level: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
  pinned: z.boolean(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
