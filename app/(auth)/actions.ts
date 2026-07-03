"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type ActionResult = { error: string } | undefined;

/** Só permite caminhos internos relativos (evita open redirect). */
function safeRedirect(target?: string): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/dashboard";
}

/**
 * Registra um novo usuário (senha com bcrypt) e já autentica, redirecionando
 * para `redirectTo` (padrão /dashboard). Retorna `{ error }` em caso de falha.
 */
export async function registerUser(values: unknown, redirectTo?: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: "Já existe uma conta com este email" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.create({
    data: { name, email: normalizedEmail, password: hashedPassword },
  });

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: safeRedirect(redirectTo),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas houve um erro ao entrar. Faça login." };
    }
    throw error; // repassa o redirect do Next.js
  }
}

/**
 * Autentica com email/senha. Retorna `{ error }` em caso de credenciais inválidas.
 */
export async function authenticate(values: unknown, redirectTo?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: safeRedirect(redirectTo),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error; // repassa o redirect do Next.js
  }
}
