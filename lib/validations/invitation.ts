import { z } from "zod";

// Não é possível convidar alguém diretamente como OWNER.
export const inviteMemberSchema = z.object({
  email: z.string().min(1, "Informe o email").email("Email inválido"),
  role: z.enum(["ADMIN", "MEMBER"], { message: "Papel inválido" }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
