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

const router = express.Router();

router.get("", ListAllBlogs);
router.get("/me", authenticateToken, GetMyBlogs);
router.post(
  "/create",
  authenticateToken,
  blogUpload.single("image"),
  bodyValidator(CreateBlogValidation),
  createBlog,
);
router.get("/:id", authenticateToken,  BlogDetailById);
router.get("/slug/:slug", BlogDetailBySlug);
router.put("/:id", authenticateToken,upload.single("image"), BlogUpdateById);
router.delete("/:id", authenticateToken, BlogDeleteById);
router.patch(
  "/:id/unpublish",
  authenticateToken,
  authorizeUser("admin"),
  UnpublishBlogById,
);

export default router;
