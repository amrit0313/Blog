import express from "express";
import { deleteBlogs, addAnotherAdmin, deleteUser } from "./admin.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";
import { AdminListAllBlogs } from "../blog/blog.controller";

const router = express.Router();

router.delete("/blog/:id", authenticateToken, authorizeUser("admin"), deleteBlogs);
router.patch(
  "/:id",
  authenticateToken,
  authorizeUser("admin"),
  addAnotherAdmin,
);
router.get('',authenticateToken,authorizeUser("admin"),AdminListAllBlogs)
router.delete("/user/:id", authenticateToken, authorizeUser("admin"), deleteUser);

export default router;
