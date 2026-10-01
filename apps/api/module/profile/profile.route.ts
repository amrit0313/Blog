import express from "express";
import { authenticateToken } from "../auth/auth.middleware";
import { createOrUpdateProfile, getProfile, getPublicProfile } from "./profile.controller";
import bodyValidator from "../../services/validator.middleware";
import { profileValidation } from "./profile.validation";
import { imageUpload } from "../../middlewares/upload";
const router = express.Router();

router.patch(
  "",
  authenticateToken,
  imageUpload.single("avatar"),
  bodyValidator(profileValidation),
  createOrUpdateProfile,
);
router.get("", authenticateToken, getProfile);
router.get("/:userId", getPublicProfile);

export default router;
