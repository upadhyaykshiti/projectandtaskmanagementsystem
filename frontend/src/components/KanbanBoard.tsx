import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import toast from "react-hot-toast";
import { Task, TaskStatus, TaskPriority, ProjectMember } from "../types/api";
import { useUpdateTask } from "../hooks/index";



const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", color: "bg-yellow-50" },
  { id: "done", label: "Done", color: "bg-green-50" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};


function TaskCard({
  task,
  members,
  isDragging = false,
}: {
  task: Task;
  members: ProjectMember[];
  isDragging?: boolean;
}) {
  const assignee = members.find(
  (m) => m.userId === task.assignedTo
);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
    // console.log("TASK CARD:", task);
    
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-50" : "hover:border-gray-300 hover:shadow-sm"
      } transition-all`}
    >
      <p className="mb-2 text-sm font-medium text-gray-900 line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
          {/* {task.assignee && <span className="truncate">{task.assignee.name}</span>} */}
          <span className="text-gray-500 truncate">
            {assignee?.user?.name || "Unassigned"}</span>
          {task.dueDate && (
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  id,
  label,
  color,
  tasks,
  activeId,
  members
}: {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  activeId: string | null;
  members: ProjectMember[];

}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl ${color} ${isOver ? "ring-2 ring-indigo-400" : ""} transition-all`}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 px-3 pb-3 space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} members={members} isDragging={task.id === activeId} />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  priorityFilter: TaskPriority | "all";
  members: ProjectMember[];
}

export function KanbanBoard({ tasks, projectId, priorityFilter, members }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateTask = useUpdateTask(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = priorityFilter === "all"
    ? tasks
    : tasks.filter((t) => t.priority === priorityFilter);

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = String(active.id);
    const newStatus = String(over.id) as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
    } catch {
      toast.error("Failed to update task status");
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus(col.id)}
            activeId={activeId}
            members={members}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} members={members} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}