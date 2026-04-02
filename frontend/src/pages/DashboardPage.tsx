import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useProjects, useCreateProject } from "../hooks/index";
import { ProjectListItem } from "../types/api";
import { useQueryClient } from "@tanstack/react-query";


function ProjectCard({ project, onClick }: { project: ProjectListItem; onClick: () => void }) {
  const roleColor = project.role === "owner"
    ? "bg-indigo-100 text-indigo-700"
    : "bg-gray-100 text-gray-600";

  return (
    <button
      onClick={onClick}
      className="w-full p-5 text-left transition-all bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 line-clamp-1">
          {project.name}
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${roleColor}`}>
          {project.role === "owner" ? "Owner" : "Member"}
        </span>
      </div>
      {project.description && (
        <p className="mb-4 text-sm text-gray-500 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{project.memberCount} member{project.memberCount !== 1 ? "s" : ""}</span>
        <span>{project.taskCount} task{project.taskCount !== 1 ? "s" : ""}</span>
        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-xl animate-pulse">
      <div className="w-3/4 h-4 mb-3 bg-gray-200 rounded" />
      <div className="w-full h-3 mb-1 bg-gray-100 rounded" />
      <div className="w-2/3 h-3 mb-4 bg-gray-100 rounded" />
      <div className="flex gap-4">
        <div className="w-16 h-3 bg-gray-100 rounded" />
        <div className="w-16 h-3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({ name, description: description || undefined });
      toast.success("Project created!");
      onClose();
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My awesome project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Optional description..."
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm"
            >
              {createProject.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading, isError } = useProjects(page);
  const queryClient = useQueryClient();


  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between max-w-5xl px-4 py-4 mx-auto">
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            {data && (
              <p className="text-sm text-gray-500 mt-0.5">
                {data.pagination.total} project{data.pagination.total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            + New Project
          </button>
        </div>

        {isError && (
          <div className="px-4 py-3 mb-6 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            Failed to load projects. Please refresh.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : data?.data.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}


