import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useProject, useCreateTask, useAddMember, useRemoveMember, useDeleteTask } from "../hooks/index";
import { useAuth } from "../hooks/useAuth";
import { KanbanBoard } from "../components/KanbanBoard";
import { ExportSection } from "../components/ExportSection";
import { TaskPriority, ProjectMember } from "../types/api";

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const addMember = useAddMember(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMember.mutateAsync(email);
      toast.success("Member added!");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? "Failed to add member";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="colleague@example.com"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={addMember.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm">
              {addMember.isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({
  projectId,
  members,
  onClose,
}: {
  projectId: string;
  members: ProjectMember[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        projectId,
        title,
        description: description || undefined,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success("Task created!");
      onClose();
    } catch {
      toast.error("Failed to create task");
    }    
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              required autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What needs to be done?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Optional..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createTask.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm">
              {createTask.isPending ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Members Panel ────────────────────────────────────────────────────────────

function MembersPanel({
  members,
  projectId,
  isOwner,
  currentUserId,
}: {
  members: ProjectMember[];
  projectId: string;
  isOwner: boolean;
  currentUserId: string;
}) {
  const removeMember = useRemoveMember(projectId);

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await removeMember.mutateAsync(userId);
      toast.success(`${name} removed`);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => (
        <div key={m.id}
          className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1">
          <span className="text-sm text-gray-700">{m.user.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            m.role === "owner" ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"
          }`}>
            {m.role}
          </span>
          {isOwner && m.userId !== currentUserId && (
            <button
              onClick={() => handleRemove(m.userId, m.user.name)}
              className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
              title="Remove member"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl px-4 py-5 mx-auto animate-pulse">
          <div className="w-48 h-6 mb-2 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-100 rounded w-96" />
        </div>
      </div>
      <div className="max-w-6xl px-4 py-8 mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 min-h-[300px] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project, isLoading, isError } = useProject(id ?? "");
  const deleteTask = useDeleteTask(id ?? "");

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  if (isLoading) return <ProjectSkeleton />;

  if (isError || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-500">Project not found or access denied.</p>
          <button onClick={() => navigate("/dashboard")}
            className="text-sm text-indigo-600 hover:underline">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOwner = project.ownerId === user?.id;
  const currentUserMember = project.members.find((m) => m.userId === user?.id);
  const userRole = currentUserMember?.role ?? "member";

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task — owners only");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl px-4 py-5 mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => navigate("/dashboard")}
                  className="text-sm text-gray-400 hover:text-gray-600">
                  ← Dashboard
                </button>
                <span className="text-gray-300">/</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  userRole === "owner"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {userRole}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500">{project.description}</p>
              )}
            </div>
            <div className="shrink-0">
              <ExportSection projectId={project.id} />
            </div>
          </div>

          {/* Members row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <MembersPanel
              members={project.members}
              projectId={project.id}
              isOwner={isOwner}
              currentUserId={user?.id ?? ""}
            />
            {isOwner && (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3 py-1 text-xs text-gray-500 transition-colors border border-gray-300 border-dashed rounded-full hover:border-indigo-400 hover:text-indigo-600"
              >
                + Add member
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="max-w-6xl px-4 py-6 mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            {(["all", "low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  priorityFilter === p
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            + Add Task
          </button>
        </div>

        <KanbanBoard
          tasks={project.tasks}
          projectId={project.id}
          priorityFilter={priorityFilter}
          members={project.members}
        />

        {/* Owner: show delete controls below board */}
        {isOwner && project.tasks.length > 0 && (
          <details className="mt-6">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              Manage tasks (owner)
            </summary>
            <div className="mt-3 space-y-1.5">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 truncate">{task.title}</span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="ml-4 text-xs text-red-400 hover:text-red-600 shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </main>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal projectId={project.id} onClose={() => setShowAddMember(false)} />
      )}
      {showCreateTask && (
        <CreateTaskModal
          projectId={project.id}
          members={project.members}
          onClose={() => setShowCreateTask(false)}
        />
      )}
    </div>
  );
}

