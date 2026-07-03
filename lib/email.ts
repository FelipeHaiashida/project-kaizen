import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Kaizen <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export type SendResult = { sent: boolean; error?: string };

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  acceptUrl: string;
}

/**
 * Envia o email de convite via Resend. Nunca lança: retorna `{ sent }` para que
 * o fluxo de convite continue mesmo se o email falhar (o link ainda é copiável).
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  workspaceName,
  acceptUrl,
}: InvitationEmailParams): Promise<SendResult> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY ausente — convite para ${to}: ${acceptUrl}`);
    return { sent: false, error: "Serviço de email não configurado" };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `${inviterName} convidou você para o workspace ${workspaceName} no Kaizen`,
      html: renderInvitationHtml({ inviterName, workspaceName, acceptUrl }),
    });
    if (error) {
      console.error("[email] Falha ao enviar convite:", error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] Erro inesperado ao enviar convite:", err);
    return { sent: false, error: "Erro ao enviar email" };
  }
}

function renderInvitationHtml({
  inviterName,
  workspaceName,
  acceptUrl,
}: Omit<InvitationEmailParams, "to">): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px; color: #111;">Você foi convidado para o Kaizen</h1>
    <p style="color: #444; line-height: 1.5;">
      <strong>${escapeHtml(inviterName)}</strong> convidou você para participar do workspace
      <strong>${escapeHtml(workspaceName)}</strong>.
    </p>
    <p style="margin: 24px 0;">
      <a href="${acceptUrl}" style="background: #7C3AED; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Aceitar convite
      </a>
    </p>
    <p style="color: #888; font-size: 13px;">
      Ou copie e cole este link no navegador:<br />
      <a href="${acceptUrl}" style="color: #7C3AED;">${acceptUrl}</a>
    </p>
    <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
      Este convite expira em 7 dias. Se você não esperava este email, pode ignorá-lo.
    </p>
  </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
