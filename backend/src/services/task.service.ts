


import { TaskStatus, TaskPriority } from "@prisma/client";
import { prisma } from "../config/db";
import { cacheRedis, CacheKeys } from "../config/redis";
import { projectService } from "../services/project.service";
import { AppError } from "../middleware/error";

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page: number;
  limit: number;
}

export const taskService = {
  async list(userId: string, filters: TaskFilters) {
    const { projectId, status, priority, page, limit } = filters;

    // If filtering by project, verify access
    if (projectId) {
      await projectService.requireMembership(projectId, userId);
    }

    const where = {
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(priority && { priority }),
      // Scope to projects the user is part of
      ...(
        !projectId && {
          project: {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          },
        }
      ),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(
    userId: string,
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      assignedTo?: string;
      dueDate?: Date;
    }
  ) {
    await projectService.requireMembership(projectId, userId);

    // Validate assignee is a project member
    if (data.assignedTo) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: data.assignedTo } },
      });
      if (!assigneeMember) throw new AppError("Assignee must be a project member", 400, "INVALID_ASSIGNEE");
    }

    const task = await prisma.task.create({
      data: { projectId, ...data },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    await cacheRedis.del(CacheKeys.project(projectId));
    return task;
  },

  async update(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string | null;
      dueDate?: Date | null;
    }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");

    await projectService.requireMembership(task.projectId, userId);

    // Validate assignee
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: data.assignedTo } },
      });
      if (!assigneeMember) throw new AppError("Assignee must be a project member", 400, "INVALID_ASSIGNEE");
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    await cacheRedis.del(CacheKeys.project(task.projectId));
    return updated;
  },

  async delete(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError("Task not found", 404, "NOT_FOUND");

    // Only owner can delete
    await projectService.requireOwner(task.projectId, userId);

    await prisma.task.delete({ where: { id: taskId } });
    await cacheRedis.del(CacheKeys.project(task.projectId));
  },
};