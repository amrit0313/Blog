import express from "express";
const router = express.Router();
import { addUser, loginUser, getCurrentUser } from "./auth.controller";
import { authenticateToken } from "./auth.middleware";

router.post("/register", addUser);
router.post("/login", loginUser);
router.post("/me", authenticateToken, getCurrentUser);

export default router;
