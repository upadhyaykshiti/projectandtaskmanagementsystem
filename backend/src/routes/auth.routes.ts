

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { login, register, refresh, logout } from "../controllers/auth.controller";
import { loginLimiter, registerLimiter, refreshLimiter } from "../middleware/rateLimiter";

export const authRouter = Router();


const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});


authRouter.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  register
);

authRouter.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);

authRouter.post(
  "/refresh",
  refreshLimiter,
  validate(refreshSchema),
  refresh
);

authRouter.post(
  "/logout",
  validate(refreshSchema),
  logout
);