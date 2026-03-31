
import { prisma } from "../config/db";
import { AppError } from "./error";

export const checkProjectAccess = async (
  userId: string,
  projectId: string
) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId: userId } } },
      ],
    },
  });

  if (!project) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return project;
};