import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export type UploadResult = { url: string } | { error: string };

/**
 * Faz upload de uma imagem para um bucket público do Supabase Storage e retorna
 * a URL pública (com cache-buster). Valida tipo e tamanho.
 */
export async function uploadImage(bucket: string, path: string, file: File): Promise<UploadResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Formato de imagem inválido (use PNG, JPG, WEBP, GIF ou SVG)" };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "A imagem deve ter no máximo 5MB" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) {
    return { error: "Falha ao enviar a imagem. Tente novamente." };
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return { url: `${publicUrl}?v=${Date.now()}` };
}
