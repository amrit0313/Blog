import express from "express";
const router = express.Router();
import {
  addUser,
  loginUser,
  getCurrentUser,
  forgetPassword,
  resetPassword,
  refresh,
} from "./auth.controller";
import { authenticateToken } from "./auth.middleware";

router.post("/register", addUser);
router.post("/login", loginUser);
router.post("/me", authenticateToken, getCurrentUser);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

export default router;
