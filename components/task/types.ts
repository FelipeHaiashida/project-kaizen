import type { Priority } from "@prisma/client";

export type TaskAssignee = { id: string; name: string; image: string | null };
export type StatusOption = { id: string; name: string; color: string };
export type MemberOption = { id: string; name: string; image: string | null };

export type TagRef = { id: string; name: string; color: string };
export type ProjectField = { id: string; name: string; type: string; options: string[] };
export type TaskFieldValue = { fieldId: string; value: string };

export type SubtaskItem = {
  id: string;
  title: string;
  statusId: string;
};

export type AttachmentItem = {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: string; // ISO
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null; // ISO string
  estimateHours: number | null;
  statusId: string;
  status: { name: string; color: string };
  assignees: TaskAssignee[];
  tags: TagRef[];
  fieldValues: TaskFieldValue[];
  attachments: AttachmentItem[];
  subtasks: SubtaskItem[];
};

/** Tarefa com o contexto da lista (usado na visualização em lista/agrupamento). */
export type TaskViewItem = TaskListItem & { listId: string; listName: string };

export type ListRef = { id: string; name: string; color: string };
export type ColumnKey = "status" | "assignees" | "dueDate" | "priority" | "tags";
