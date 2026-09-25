import express from "express";
import bodyValidator from "../../services/validator.middleware";
import { CreateBlogValidation } from "./blog.validations";
import {createBlog,ListAllBlogs,BlogDetailById,BlogDetailBySlug,BlogUpdateById,BlogDeleteById} from "./blog.controller";
import { authenticateToken } from "../auth/auth.middleware";

const router = express.Router();

router.get("", ListAllBlogs);
router.post("/create", authenticateToken, bodyValidator(CreateBlogValidation), createBlog);
router.get("/:id", BlogDetailById);
router.get("/slug/:slug", BlogDetailBySlug);
router.put("/:id", authenticateToken,BlogUpdateById);
router.delete("/:id", authenticateToken ,BlogDeleteById);

export default router;