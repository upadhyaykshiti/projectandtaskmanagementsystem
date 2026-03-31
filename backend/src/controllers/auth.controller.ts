

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.register(name, email, password);

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refresh(refreshToken);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};