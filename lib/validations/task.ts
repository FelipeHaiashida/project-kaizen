import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Informe um título").max(200, "Título muito longo"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Informe um título").max(200, "Título muito longo"),
  description: z.string().max(20000).nullable().optional(),
  statusId: z.string().min(1, "Selecione um status"),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]),
  dueDate: z.string().nullable().optional(), // "YYYY-MM-DD" ou vazio
  assigneeIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
