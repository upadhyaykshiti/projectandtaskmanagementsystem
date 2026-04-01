
import { Router, Response, NextFunction, RequestHandler } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  triggerExport,
  getExport,
  listExports,
} from "../controllers/export.controller";

export const exportRouter = Router();

exportRouter.use(authenticate);

// async wrapper
const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

// POST /api/projects/:id/export
exportRouter.post(
  "/:id/export",
  asyncHandler(triggerExport)
);

// GET /api/exports/:id
exportRouter.get(
  "/:id",
  asyncHandler(getExport)
);

// GET /api/exports
exportRouter.get(
  "/",
  asyncHandler(listExports)
);