// import { Response } from "express";
// import { AuthRequest } from "../middlewares/auth.middleware";
// import {
//   createTaskService,
//   updateTaskService,
// } from "../services/task.service";

// export const createTask = async (req: AuthRequest, res: Response) => {
//   const task = await createTaskService(req.body);
//   res.status(201).json({ success: true, data: task });
// };

// export const updateTask = async (req: AuthRequest, res: Response) => {
//   const task = await updateTaskService(req.params.id, req.body);
//   res.json({ success: true, data: task });
// };



import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { taskService } from "../services/task.service";

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, priority, page, limit } = req.query as any;

    const result = await taskService.list(req.userId, {
      projectId: project_id,
      status,
      priority,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, ...data } = req.body;

    const task = await taskService.create(req.userId, projectId, data);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.update(
      req.params.id,
      req.userId,
      req.body
    );

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await taskService.delete(req.params.id, req.userId);

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};