import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  detail?: Record<string, string>;
}

const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    result: null,
    message,
    detail: err.detail || null,
  });
};

export default errorHandler;