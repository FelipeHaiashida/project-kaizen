import { TaskRow } from "@/components/task/task-row";
import { InlineTaskCreate } from "@/components/task/inline-task-create";
import type { TaskListItem, StatusOption, MemberOption } from "@/components/task/types";

export function TasksList({
  listId,
  tasks,
  statuses,
  members,
}: {
  listId: string;
  tasks: TaskListItem[];
  statuses: StatusOption[];
  members: MemberOption[];
}) {
  return (
    <div className="space-y-0.5">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} listId={listId} statuses={statuses} members={members} />
      ))}
      <InlineTaskCreate listId={listId} />
    </div>
  );
}
