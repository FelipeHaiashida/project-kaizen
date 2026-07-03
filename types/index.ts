// Tipos globais compartilhados da aplicação Kaizen.
// Reexporta os tipos e enums gerados pelo Prisma para uso em toda a app,
// e centraliza tipos utilitários adicionais.

export type {
  User,
  Workspace,
  WorkspaceMember,
  Invitation,
  Project,
  List,
  TaskStatus,
  Task,
  TaskAssignee,
  Tag,
  TaskTag,
  CustomField,
  Attachment,
  Comment,
  CommentReaction,
  Notification,
} from "@prisma/client";

export { Role, Priority, CustomFieldType, NotificationType } from "@prisma/client";
