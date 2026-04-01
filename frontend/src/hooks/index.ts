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
