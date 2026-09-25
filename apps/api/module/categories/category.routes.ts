import express from "express";
import {createCategory,ListAllCategories,CategoryDetailById,CategoryUpdateById,CategoryDeleteById} from "./category.controller";

const router = express.Router();

router.get("", ListAllCategories);
router.post("/create", createCategory);
router.get("/:id", CategoryDetailById);
router.put("/:id", CategoryUpdateById);
router.delete("/:id", CategoryDeleteById);

export default router;