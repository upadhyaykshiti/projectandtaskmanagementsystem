


import { Router, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  getProjects,
  createProject,
  getProjectById,
  addMember,
  removeMember,
} from "../controllers/project.controller";

export const projectsRouter = Router();

projectsRouter.use(authenticate);

// asyncHandler
const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

// Schemas
const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
  }),
});

const projectIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const addMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email(),
  }),
});

const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
  }),
});


projectsRouter.get(
  "/",
  validate(paginationSchema),
  asyncHandler(getProjects)   
);

projectsRouter.post(
  "/",
  validate(createProjectSchema),
  asyncHandler(createProject) 
);

projectsRouter.get(
  "/:id",
  validate(projectIdSchema),
  asyncHandler(getProjectById) 
);

projectsRouter.post(
  "/:id/members",
  validate(addMemberSchema),
  asyncHandler(addMember) 
);

projectsRouter.delete(
  "/:id/members/:userId",
  validate(removeMemberSchema),
  asyncHandler(removeMember) 
);