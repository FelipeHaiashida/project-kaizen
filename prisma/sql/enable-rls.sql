-- ============================================================================
-- Row Level Security (RLS) — Kaizen
-- ----------------------------------------------------------------------------
-- Habilita RLS em todas as tabelas do schema `public`.
--
-- Modelo de segurança:
--   * O Prisma conecta como o papel `postgres` (DONO das tabelas). O dono
--     IGNORA RLS por padrão (não usamos FORCE ROW LEVEL SECURITY), então as
--     Server Actions continuam funcionando normalmente.
--   * A chave `service_role` (uploads de imagem) tem BYPASSRLS — inalterada.
--   * A chave `anon` (usada só no browser p/ realtime) passa a ser SUJEITA a
--     RLS. Sem nenhuma POLICY criada, o efeito é "negar tudo" para a anon —
--     fechando qualquer leitura/assinatura direta de dados via a API pública.
--
-- Reversível com: ALTER TABLE "<tabela>" DISABLE ROW LEVEL SECURITY;
-- ============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Epic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "List" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskStatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskAssignee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomFieldValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommentReaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnnouncementRead" ENABLE ROW LEVEL SECURITY;
