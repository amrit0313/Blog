import express from "express";
import bodyValidator from "../../services/validator.middleware";
import { CreateBlogValidation } from "./blog.validations";
import { createBlog, ListAllBlogs } from "./blog.controller";
const router = express.Router();

router.get("", ListAllBlogs);
router.post("/create", bodyValidator(CreateBlogValidation), createBlog);

export default router;
