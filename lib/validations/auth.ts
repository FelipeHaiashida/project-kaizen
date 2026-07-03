import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(60, "Nome muito longo"),
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
