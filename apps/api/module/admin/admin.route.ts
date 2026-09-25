import express from "express";
import { deleteBlogs, addAnotherAdmin } from "./admin.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";

const router = express.Router();

router.delete("/:id", authenticateToken, authorizeUser("admin"), deleteBlogs);
router.patch(
  "/:id",
  authenticateToken,
  authorizeUser("admin"),
  addAnotherAdmin,
);

export default router;
