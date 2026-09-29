import express from "express";
import { authenticateToken } from "../auth/auth.middleware";
import { createOrUpdateProfile, getProfile } from "./profile.controller";
import { profileUpload } from "../../middlewares/fileupload.middleware";
import bodyValidator from "../../services/validator.middleware";
import { profileValidation } from "./profile.validation";
const router = express.Router();

router.patch(
  "",
  authenticateToken,
  profileUpload.single("avatar"),
  bodyValidator(profileValidation),
  createOrUpdateProfile,
);
router.get("", authenticateToken, getProfile);

export default router;
