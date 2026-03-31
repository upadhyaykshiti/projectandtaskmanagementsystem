

import { MemberRole } from "@prisma/client";
import { prisma } from "../config/db";
import { cacheRedis, CacheKeys, CacheTTL } from "../config/redis";
import { AppError } from "../middleware/error";
import { getPagination } from "../utils/pagination";

export const projectService = {
 
  async listForUser(userId: string, page: number, limit: number) {
    const { skip, take } = getPagination(page, limit);

    const cacheKey = CacheKeys.userProjects(userId);
    const cached = await cacheRedis.get(cacheKey);

    if (cached) {
      const all = JSON.parse(cached) as any[];
      const total = all.length;

      return {
        data: all.slice(skip, skip + take),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          _count: { select: { members: true, tasks: true } },
          members: { where: { userId }, select: { role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      }),
    ]);

    const mapped = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      memberCount: p._count.members,
      taskCount: p._count.tasks,
      role: p.members[0]?.role ?? "owner",
    }));

    await cacheRedis.setex(cacheKey, CacheTTL.userProjects, JSON.stringify(mapped));

    return {
      data: mapped.slice(skip, skip + take),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  
   // CREATE PROJECT
   
  async create(userId: string, name: string, description?: string) {
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: { name, description, ownerId: userId },
      });

      await tx.projectMember.create({
        data: {
          projectId: p.id,
          userId,
          role: MemberRole.owner,
        },
      });

      return p;
    });

    await cacheRedis.del(CacheKeys.userProjects(userId));
    return project;
  },

  
   // GET PROJECT (with RBAC + cache)
   
  async getById(projectId: string, userId: string) {
    const cacheKey = CacheKeys.project(projectId);
    const cached = await cacheRedis.get(cacheKey);

    if (cached) {
      const project = JSON.parse(cached);

      const isMember = project.members?.some(
        (m: { userId: string }) => m.userId === userId
      );

      if (!isMember) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }

      return project;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404, "NOT_FOUND");
    }

    const membership = project.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    await cacheRedis.setex(cacheKey, CacheTTL.project, JSON.stringify(project));

    return project;
  },

  
   // RBAC HELPERS
   
  async requireMembership(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError("Project not found", 404, "NOT_FOUND");
      }

      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    return member;
  },

  async requireOwner(projectId: string, userId: string) {
    const member = await projectService.requireMembership(projectId, userId);

    if (member.role !== MemberRole.owner) {
      throw new AppError("Owner access required", 403, "FORBIDDEN");
    }

    return member;
  },

  
  // ADD MEMBER
  async addMember(projectId: string, requesterId: string, email: string) {
    await projectService.requireOwner(projectId, requesterId);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (existing) {
      throw new AppError("Already a member", 409, "ALREADY_MEMBER");
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: MemberRole.member,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await Promise.all([
      cacheRedis.del(CacheKeys.project(projectId)),
      cacheRedis.del(CacheKeys.userProjects(requesterId)),
      cacheRedis.del(CacheKeys.userProjects(user.id)),
    ]);

    return member;
  },

  
   // REMOVE MEMBER
   
  async removeMember(projectId: string, requesterId: string, targetUserId: string) {
    await projectService.requireOwner(projectId, requesterId);

    if (requesterId === targetUserId) {
      throw new AppError("Owner cannot remove themselves", 400, "INVALID_OPERATION");
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    if (!member) {
      throw new AppError("Member not found", 404, "NOT_FOUND");
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    await Promise.all([
      cacheRedis.del(CacheKeys.project(projectId)),
      cacheRedis.del(CacheKeys.userProjects(targetUserId)),
    ]);
  },
};