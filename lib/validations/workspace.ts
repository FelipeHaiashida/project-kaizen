import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugField = z
  .string()
  .min(3, "O slug deve ter ao menos 3 caracteres")
  .max(40, "O slug deve ter no máximo 40 caracteres")
  .regex(SLUG_REGEX, "Use apenas letras minúsculas, números e hífens");

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(50, "Nome muito longo"),
  slug: slugField,
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(50, "Nome muito longo"),
  slug: slugField,
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/** Gera um slug a partir de um texto livre (nome do workspace). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
