import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { exportService } from "../services/export.service";

export const triggerExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await exportService.trigger(
      req.userId,
      req.params.id
    );

    res.status(202).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await exportService.getById(
      req.params.id,
      req.userId
    );

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listExports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await exportService.list(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};