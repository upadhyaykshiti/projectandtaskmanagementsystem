import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "../services/api";
import {
  ApiResponse,
  PaginatedResponse,
  ProjectListItem,
  ProjectWithDetails,
  Task,
  Export,
  CreateProjectPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from "../types/api";
import { useAuth } from "./useAuth";


// ─── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  projects: (userId: string | undefined, page?: number) => ["projects", userId, page] as const,
  project: (id: string) => ["project", id] as const,
  tasks: (filters: TaskFilters) => ["tasks", filters] as const,
  exports: () => ["exports"] as const,
  exportStatus: (id: string) => ["export", id] as const,
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjects(page = 1, limit = 10) {
    const { user } = useAuth(); 
    const user_Id = user?.id; 
  return useQuery({
    queryKey: queryKeys.projects(user_Id, page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ProjectListItem>>(
        `/projects?page=${page}&limit=${limit}`
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProjectWithDetails>>(`/projects/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await api.post<ApiResponse<ProjectWithDetails>>("/projects", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post(`/projects/${projectId}/members`, { email });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.project_id) params.set("project_id", filters.project_id);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<PaginatedResponse<Task>>(`/tasks?${params}`);
      return data;
    },
    enabled: Boolean(filters.project_id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data } = await api.post<ApiResponse<Task>>("/tasks", payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}


export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
      return data.data;
    },

    // 🔥 Optimistic update (FIXED)
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.project(projectId) });

      const previousProject = queryClient.getQueryData(queryKeys.project(projectId));

      queryClient.setQueryData(
        queryKeys.project(projectId),
        (old: ProjectWithDetails | undefined) => {
          if (!old) return old;

          return {
            ...old,
            tasks: old.tasks.map((t) => {
              if (t.id !== id) return t;

              return {
                ...t,
                ...updates,

                // ✅ FIX: properly inside object
                ...(updates.assignedTo !== undefined && {
                  assignee: updates.assignedTo
                    ? {
                        id: updates.assignedTo,
                        name: "Updating...", // temp
                      }
                    : null,
                }),
              };
            }),
          };
        }
      );

      return { previousProject };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(queryKeys.project(projectId), context.previousProject);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}