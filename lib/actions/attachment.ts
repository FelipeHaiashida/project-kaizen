"use server";

import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AttachmentActionState = { error?: string; success?: string };

const BUCKET = "task-attachments";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function assertTask(taskId: string) {
  const active = await getActiveWorkspace();
  if (!active) return null;
  return db.task.findFirst({
    where: { id: taskId, list: { project: { workspaceId: active.workspace.id } } },
    select: { id: true },
  });
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

/** Faz upload de um arquivo (qualquer tipo, até 10MB) e registra o anexo na tarefa. */
export async function uploadAttachment(
  taskId: string,
  formData: FormData
): Promise<AttachmentActionState> {
  const task = await assertTask(taskId);
  if (!task) return { error: "Tarefa não encontrada" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo" };
  if (file.size > MAX_SIZE) return { error: "O arquivo deve ter no máximo 10MB" };

  const path = `${taskId}/${Date.now()}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return { error: "Falha ao enviar o arquivo" };

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  await db.attachment.create({
    data: { name: file.name, url: publicUrl, size: file.size, taskId },
  });

  return { success: "Anexo enviado" };
}

/** Exclui um anexo (remove do Storage e do banco). */
export async function deleteAttachment(attachmentId: string): Promise<AttachmentActionState> {
  const active = await getActiveWorkspace();
  if (!active) return { error: "Nenhum workspace ativo" };

  const attachment = await db.attachment.findFirst({
    where: { id: attachmentId, task: { list: { project: { workspaceId: active.workspace.id } } } },
  });
  if (!attachment) return { error: "Anexo não encontrado" };

  // Extrai o caminho do objeto a partir da URL pública
  const marker = `/object/public/${BUCKET}/`;
  const idx = attachment.url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(attachment.url.slice(idx + marker.length).split("?")[0]);
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
  }

  await db.attachment.delete({ where: { id: attachmentId } });
  return { success: "Anexo excluído" };
}
