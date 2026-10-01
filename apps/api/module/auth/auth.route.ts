import express from "express";
const router = express.Router();
import {
  addUser,
  verifyEmail,
  loginUser,
  getCurrentUser,
  forgetPassword,
  resetPassword,
  refresh,
} from "./auth.controller";
import { authenticateToken } from "./auth.middleware";

router.post("/register", addUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/me", authenticateToken, getCurrentUser);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

export default router;
