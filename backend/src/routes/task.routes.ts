
// import { Router, Response, NextFunction, RequestHandler } from "express";
// import { z } from "zod";
// import { TaskStatus, TaskPriority } from "@prisma/client";
// import { authenticate, AuthRequest } from "../middleware/auth";
// import { taskService } from "../services/task.service";

// export const tasksRouter = Router();
// tasksRouter.use(authenticate);

// // -------------------- Async Handler Wrapper --------------------
// const asyncHandler = (fn: RequestHandler) => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next);

// // -------------------- Validation Schemas --------------------
// const taskFiltersSchema = z.object({
//   project_id: z.string().uuid().optional(),
//   status: z.nativeEnum(TaskStatus).optional(),
//   priority: z.nativeEnum(TaskPriority).optional(),
//   page: z.coerce.number().int().min(1).default(1),
//   limit: z.coerce.number().int().min(1).max(50).default(10),
// });

// const createTaskSchema = z.object({
//   projectId: z.string().uuid(),
//   title: z.string().min(1).max(500),
//   description: z.string().max(5000).optional(),
//   priority: z.nativeEnum(TaskPriority).optional(),
//   assignedTo: z.string().uuid().optional(),
//   dueDate: z.coerce.date().optional(),
// });

// const updateTaskSchema = z.object({
//   title: z.string().min(1).max(500).optional(),
//   description: z.string().max(5000).optional(),
//   status: z.nativeEnum(TaskStatus).optional(),
//   priority: z.nativeEnum(TaskPriority).optional(),
//   assignedTo: z.string().uuid().nullable().optional(),
//   dueDate: z.coerce.date().nullable().optional(),
// });

// // -------------------- Routes --------------------

// // GET /api/tasks
// tasksRouter.get(
//   "/",
//   asyncHandler(async (req: AuthRequest, res: Response) => {
//     const filters = taskFiltersSchema.parse(req.query);
//     const result = await taskService.list(req.userId, {
//       projectId: filters.project_id,
//       status: filters.status,
//       priority: filters.priority,
//       page: filters.page,
//       limit: filters.limit,
//     });
//     res.json({ success: true, ...result });
//   })
// );

// // POST /api/tasks
// tasksRouter.post(
//   "/",
//   asyncHandler(async (req: AuthRequest, res: Response) => {
//     const body = createTaskSchema.parse(req.body);
//     const task = await taskService.create(req.userId, body.projectId, {
//       title: body.title,
//       description: body.description,
//       priority: body.priority,
//       assignedTo: body.assignedTo,
//       dueDate: body.dueDate,
//     });
//     res.status(201).json({ success: true, data: task });
//   })
// );

// // PATCH /api/tasks/:id
// tasksRouter.patch(
//   "/:id",
//   asyncHandler(async (req: AuthRequest, res: Response) => {
//     const body = updateTaskSchema.parse(req.body);
//     const task = await taskService.update(req.params.id, req.userId, body);
//     res.json({ success: true, data: task });
//   })
// );

// // DELETE /api/tasks/:id
// tasksRouter.delete(
//   "/:id",
//   asyncHandler(async (req: AuthRequest, res: Response) => {
//     await taskService.delete(req.params.id, req.userId);
//     res.json({ success: true, data: null });
//   })
// );









import { Router, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller";

export const tasksRouter = Router();
tasksRouter.use(authenticate);

// ✅ async handler (IMPORTANT)
const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

// -------------------- Schemas --------------------

const taskFiltersSchema = z.object({
  query: z.object({
    project_id: z.string().uuid().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assignedTo: z.string().uuid().optional(),
    dueDate: z.coerce.date().optional(),
  }),
});

const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
  }),
});

// -------------------- Routes --------------------

// GET /api/tasks
tasksRouter.get(
  "/",
  validate(taskFiltersSchema),
  asyncHandler(getTasks)
);

// POST /api/tasks
tasksRouter.post(
  "/",
  validate(createTaskSchema),
  asyncHandler(createTask)
);

// PATCH /api/tasks/:id
tasksRouter.patch(
  "/:id",
  validate(updateTaskSchema),
  asyncHandler(updateTask)
);

// DELETE /api/tasks/:id
tasksRouter.delete(
  "/:id",
  asyncHandler(deleteTask)
);