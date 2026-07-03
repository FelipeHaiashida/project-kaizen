import { TaskRow } from "@/components/task/task-row";
import { InlineTaskCreate } from "@/components/task/inline-task-create";
import type {
  TaskListItem,
  StatusOption,
  MemberOption,
  TagRef,
  ProjectField,
} from "@/components/task/types";

export function TasksList({
  listId,
  tasks,
  statuses,
  members,
  projectTags,
  projectFields,
}: {
  listId: string;
  tasks: TaskListItem[];
  statuses: StatusOption[];
  members: MemberOption[];
  projectTags: TagRef[];
  projectFields: ProjectField[];
}) {
  return (
    <div className="space-y-0.5">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          listId={listId}
          statuses={statuses}
          members={members}
          projectTags={projectTags}
          projectFields={projectFields}
        />
      ))}
      <InlineTaskCreate listId={listId} />
    </div>
  );
}
