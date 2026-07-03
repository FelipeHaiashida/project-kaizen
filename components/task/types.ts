import type { Priority } from "@prisma/client";

export type TaskAssignee = { id: string; name: string; image: string | null };
export type StatusOption = { id: string; name: string; color: string };
export type MemberOption = { id: string; name: string; image: string | null };

export type SubtaskItem = {
  id: string;
  title: string;
  statusId: string;
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null; // ISO string
  statusId: string;
  status: { name: string; color: string };
  assignees: TaskAssignee[];
  subtasks: SubtaskItem[];
};
