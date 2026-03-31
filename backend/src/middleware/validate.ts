

import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./error";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(", ");
      return next(new AppError(message, 422, "VALIDATION_ERROR"));
    }

    // overwrite with validated data
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
  };