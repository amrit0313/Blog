import express from "express";
import { authenticateToken } from "../auth/auth.middleware";
import {
  createOrUpdateProfile,
  getProfile,
  getPublicProfile,
  removeSavedBlog,
  saveBlog,
} from "./profile.controller";
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
router.put("/saved-blogs/:blogId", authenticateToken, saveBlog);
router.delete("/saved-blogs/:blogId", authenticateToken, removeSavedBlog);
router.get("/:userId", getPublicProfile);

export default router;
