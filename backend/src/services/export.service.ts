

import { prisma } from "../config/db";
import { exportQueue } from "../config/queue";
import { AppError } from "../middleware/error";
import { projectService } from "./project.service";

export const exportService = {
  async trigger(userId: string, projectId: string) {
    // ✅ RBAC check
    await projectService.requireMembership(projectId, userId);

    // 1. Create export record
    const exportRecord = await prisma.export.create({
      data: {
        userId,
        projectId,
        status: "pending",
      },
    });

    // 2. Add job to queue (WITH RETRIES)
    await exportQueue.add(
      "export-job",
      {
        exportId: exportRecord.id,
        projectId,
        userId,
      },
      {
        attempts: 3, // 1 + 2 retries ✅
        backoff: {
          type: "exponential",
          delay: 5000, // 5 sec → 10 → 20
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    // 3. Return immediately
    return exportRecord;
  },

  async getById(exportId: string, userId: string) {
    const record = await prisma.export.findFirst({
      where: { id: exportId, userId },
    });

    if (!record) throw new AppError("Export not found", 404);

    return record;
  },

  async list(userId: string) {
    return prisma.export.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};