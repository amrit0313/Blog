import express from "express";
import {
  deleteBlogs,
  addAnotherAdmin,
  deleteUser,
  createUser,
  verifyBlog,
  rejectBlog,
  addFeatureBlog,
} from "./admin.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";
import { AdminListAllBlogs } from "../blog/blog.controller";

const router = express.Router();

router.delete(
  "/blog/:id",
  authenticateToken,
  authorizeUser("admin"),
  deleteBlogs,
);
router.patch(
  "/:id",
  authenticateToken,
  authorizeUser("admin"),
  addAnotherAdmin,
);
router.get("", authenticateToken, authorizeUser("admin"), AdminListAllBlogs);
router.delete(
  "/user/:id",
  authenticateToken,
  authorizeUser("admin"),
  deleteUser,
);
router.post(
  "/user/create",
  authenticateToken,
  authorizeUser("admin"),
  createUser,
);
router.patch(
  "/blog/:id/verify",
  authenticateToken,
  authorizeUser("admin"),
  verifyBlog,
);
router.patch(
  "/blog/:id/reject",
  authenticateToken,
  authorizeUser("admin"),
  rejectBlog,
);
router.patch(
  "/blog/:id/featured",
  authenticateToken,
  authorizeUser("admin"),
  addFeatureBlog,
);

export default router;
