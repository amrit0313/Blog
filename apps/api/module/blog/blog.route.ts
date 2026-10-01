import express from "express";
import bodyValidator from "../../services/validator.middleware";
import { CreateBlogValidation } from "./blog.validations";
import {
  createBlog,
  ListAllBlogs,
  GetMyBlogs,
  BlogDetailById,
  BlogDetailBySlug,
  BlogDeleteById,
  UnpublishBlogById,
  BlogUpdateBySlug,
} from "./blog.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";
import { blogUpload } from "../../middlewares/fileupload.middleware";
import { imageUpload } from "../../middlewares/upload";
import commentRoutes from "../comment/comment.routes";
import { toggleLike } from "./blog.controller";

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
router.get("/slug/:slug", BlogDetailBySlug);
router.get("/:id", BlogDetailById);
router.put(
  "/slug/:slug",
  authenticateToken,
  blogUpload.single("image"),
  BlogUpdateBySlug,
);
router.delete("/:id", authenticateToken, BlogDeleteById);
router.patch(
  "/:id/unpublish",
  authenticateToken,
  authorizeUser("admin"),
  UnpublishBlogById,
);

router.put("/:id/like", authenticateToken, toggleLike);
router.use("/:blogId/comments", commentRoutes);

export default router;
