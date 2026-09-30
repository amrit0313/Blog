import express from "express";
import bodyValidator from "../../services/validator.middleware";
import { CreateBlogValidation } from "./blog.validations";
import {
  createBlog,
  ListAllBlogs,
  GetMyBlogs,
  BlogDetailById,
  BlogDetailBySlug,
  BlogUpdateById,
  BlogDeleteById,
  UnpublishBlogById,
} from "./blog.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";
import { blogUpload } from "../../middlewares/fileupload.middleware";
import { imageUpload } from "../../middlewares/upload";

const router = express.Router();

router.get("", ListAllBlogs);

router.get("/me", authenticateToken, GetMyBlogs);
router.post(
  "/create",
  authenticateToken,
  imageUpload.single("image"),
  bodyValidator(CreateBlogValidation),
  createBlog,
);
router.get("/:id", authenticateToken, BlogDetailById);
router.get("/slug/:slug",authenticateToken, BlogDetailBySlug);
router.put(
  "/:id",
  authenticateToken,
  imageUpload.single("image"),
  BlogUpdateById,
);
router.delete("/:id", authenticateToken, BlogDeleteById);
router.patch(
  "/:id/unpublish",
  authenticateToken,
  authorizeUser("admin"),
  UnpublishBlogById,
);

export default router;
