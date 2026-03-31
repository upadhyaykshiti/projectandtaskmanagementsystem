

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "MISSING_TOKEN", message: "Authorization token required" },
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = authService.verifyAccessToken(token);
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
    });
  }
}