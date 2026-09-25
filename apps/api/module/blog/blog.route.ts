import express from "express";
import bodyValidator from "../../services/validator.middleware";
import { CreateBlogValidation } from "./blog.validations";
import {createBlog,ListAllBlogs,BlogDetailById,BlogDetailBySlug,BlogUpdateById,BlogDeleteById} from "./blog.controller";

const router = express.Router();

router.get("", ListAllBlogs);
router.post("/create", bodyValidator(CreateBlogValidation), createBlog);
router.get("/:id", BlogDetailById);
router.get("/slug/:slug", BlogDetailBySlug);
router.put("/:id", BlogUpdateById);
router.delete("/:id", BlogDeleteById);

export default router;