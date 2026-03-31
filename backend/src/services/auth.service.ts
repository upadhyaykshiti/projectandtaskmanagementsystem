

import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/db";
import { cacheRedis, CacheKeys } from "../config/redis";
import { AppError } from "../middleware/error";
import { JWT_CONFIG } from "../config/jwt";


export interface JwtPayload {
  userId: string;
  email: string;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already in use", 409, "EMAIL_IN_USE");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return user;
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const accessToken = authService.signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await authService.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  async refresh(refreshToken: string) {
    const key = CacheKeys.refreshToken(refreshToken);
    const userId = await cacheRedis.get(key);
    if (!userId) throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new AppError("User not found", 401, "INVALID_REFRESH_TOKEN");

    // Rotate: invalidate old, issue new
    await cacheRedis.del(key);
    const newRefreshToken = await authService.issueRefreshToken(user.id);
    const accessToken = authService.signAccessToken({ userId: user.id, email: user.email });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    const key = CacheKeys.refreshToken(refreshToken);
    await cacheRedis.del(key);
  },

  
  signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_CONFIG.accessExpiresIn,
  };

  return jwt.sign(payload, JWT_CONFIG.accessSecret, options);
},

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_CONFIG.accessSecret) as JwtPayload;
    } catch {
      throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
    }
  },

  async issueRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(48).toString("hex");
    const key = CacheKeys.refreshToken(token);
    await cacheRedis.setex(key, JWT_CONFIG.refreshExpiresSeconds, userId);
    return token;
  },
};