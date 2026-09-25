import express from "express";
import {createCategory,ListAllCategories,CategoryDetailById,CategoryUpdateById,CategoryDeleteById} from "./category.controller";
import { authenticateToken } from "../auth/auth.middleware";

const router = express.Router();

router.get("", ListAllCategories);
router.post("/create", authenticateToken,createCategory);
router.get("/:id", CategoryDetailById);
router.put("/:id",authenticateToken, CategoryUpdateById);
router.delete("/:id",authenticateToken, CategoryDeleteById);

export default router;