import express from "express";
import { deleteBlogs, addAnotherAdmin } from "./admin.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";
import { AdminListAllBlogs } from "../blog/blog.controller";

const router = express.Router();

router.delete("/:id", authenticateToken, authorizeUser("admin"), deleteBlogs);
router.patch(
  "/:id",
  authenticateToken,
  authorizeUser("admin"),
  addAnotherAdmin,
);
router.get('',authenticateToken,authorizeUser("admin"),AdminListAllBlogs)

export default router;
