import { Request, Response, NextFunction } from "express";

/**
 * Application error with an optional HTTP status and response details.
 */
interface AppError extends Error {
  status?: number;
  detail?: Record<string, string>;
}

/**
 * Handles application errors and sends a consistent JSON response.
 *
 * @param err - Error raised while processing the request.
 * @param req - Express request that caused the error.
 * @param res - Express response used to return the error details.
 * @param next - Express error middleware continuation callback.
 * @returns void
 */
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