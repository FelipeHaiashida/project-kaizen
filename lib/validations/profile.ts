import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(60, "Nome muito longo"),
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
  bio: z.string().max(280, "Bio deve ter no máximo 280 caracteres").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter ao menos 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Limites de upload de avatar
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
