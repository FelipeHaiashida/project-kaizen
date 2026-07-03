"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { supabaseAdmin, AVATARS_BUCKET } from "@/lib/supabase/admin";
import {
  updateProfileSchema,
  changePasswordSchema,
  MAX_AVATAR_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/validations/profile";

export type ActionState = { error?: string; success?: string };

/** Atualiza nome, email, bio e (opcional) a foto de perfil. Recebe FormData por causa do upload. */
export async function updateProfile(formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { name, email, bio } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Email precisa ser único (se mudou)
  const emailOwner = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (emailOwner && emailOwner.id !== session.user.id) {
    return { error: "Este email já está em uso por outra conta" };
  }

  let imageUrl: string | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Formato de imagem inválido (use PNG, JPG, WEBP ou GIF)" };
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return { error: "A imagem deve ter no máximo 5MB" };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${session.user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (uploadError) {
      return { error: "Falha ao enviar a imagem. Tente novamente." };
    }
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    // cache-buster para refletir a nova imagem no mesmo caminho
    imageUrl = `${publicUrl}?v=${Date.now()}`;
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email: normalizedEmail,
      bio: bio ?? null,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  });

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");
  return { success: "Perfil atualizado com sucesso" };
}

/** Troca a senha do usuário (valida a senha atual). */
export async function changePassword(values: unknown): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    return { error: "Esta conta não usa senha (login via provedor externo)" };
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return { error: "Senha atual incorreta" };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hashed } });

  return { success: "Senha alterada com sucesso" };
}
