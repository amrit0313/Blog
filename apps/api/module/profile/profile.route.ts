import express from "express";
import { authenticateToken } from "../auth/auth.middleware";
import { createOrUpdateProfile, getProfile } from "./profile.controller";
import { upload } from "../../middlewares/fileupload.middleware";
const router = express.Router();

router.patch(
  "",
  authenticateToken,
  upload.single("avatar"),
  createOrUpdateProfile,
);
router.get("", authenticateToken, getProfile);

export default router;
