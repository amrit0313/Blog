import express from "express";
import {createCategory,ListAllCategories,CategoryDetailById,CategoryUpdateById,CategoryDeleteById} from "./category.controller";
import { authenticateToken, authorizeUser } from "../auth/auth.middleware";

const router = express.Router();

router.get("", ListAllCategories);
router.post("/create", authenticateToken,authorizeUser("admin") ,createCategory);
router.get("/:id", CategoryDetailById);
router.put("/:id",authenticateToken, authorizeUser("admin"), CategoryUpdateById);
router.delete("/:id",authenticateToken, authorizeUser("admin"), CategoryDeleteById);

export default router;