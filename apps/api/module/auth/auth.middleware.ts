import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnvConfig } from "../../config/env.config";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { JWT_SECRET } = getEnvConfig();
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string"
    ) {
      return res.status(401).json({ message: "unauthorized" });
    }
    req.user = { id: decoded.id, email: decoded.email };
    console.log(req.user);

    return next();
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
};
