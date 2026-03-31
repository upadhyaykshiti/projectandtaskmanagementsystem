




import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { projectService } from "../services/project.service";

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query as any;

    const result = await projectService.listForUser(
      req.userId,
      Number(page),
      Number(limit)
    );

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    const project = await projectService.create(
      req.userId,
      name,
      description
    );

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getById(
      req.params.id,
      req.userId
    );

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const member = await projectService.addMember(
      req.params.id,
      req.userId,
      email
    );

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await projectService.removeMember(
      req.params.id,
      req.userId,
      req.params.userId
    );

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};