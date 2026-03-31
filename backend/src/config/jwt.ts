
import { SignOptions } from "jsonwebtoken";

export const JWT_CONFIG = {
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  refreshExpiresSeconds: 7 * 24 * 60 * 60,
};