// ─── Enums ────────────────────────────────────────────────────────────────────

export type MemberRole = "owner" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ExportStatus = "pending" | "processing" | "completed" | "failed";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "email">;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: Pick<User, "id" | "name" | "email"> | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
}

export interface ProjectWithDetails extends Project {
  members: ProjectMember[];
  tasks: Task[];
}

export interface ProjectListItem extends Project {
  memberCount: number;
  taskCount: number;
  role: MemberRole;
}

export interface Export {
  id: string;
  projectId: string;
  userId: string;
  status: ExportStatus;
  filePath: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "id" | "name" | "email">;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface CreateTaskPayload {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | null;
  dueDate?: string | null;
}

export interface TaskFilters {
  project_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}