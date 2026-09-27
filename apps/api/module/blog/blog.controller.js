import slugify from "slugify";
import blog from "./blog.model";
const createError = (message, status = 500) => {
    const err = new Error(message);
    err.status = status;
    return err;
};
const createBlog = async (req, res, next) => {
    try {
        const data = req.body;
        if (data.title) {
            data.slug = slugify(data.title);
        }
        const newBlog = await blog.create(data);
        res.json({
            result: newBlog,
            message: "Blog Added",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const BlogDetailById = async (req, res, next) => {
    try {
        const Blog = await blog
            .findById(req.params.id)
            .populate("author", ["_id", "name", "email"])
            .populate("category", ["_id", "title"]);
        if (!Blog) {
            throw createError("Blog not found", 404);
        }
        res.json({
            result: Blog,
            message: "Blog detail fetched",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const BlogDetailBySlug = async (req, res, next) => {
    try {
        const Blog = await blog
            .findOne({ slug: req.params.slug })
            .populate("author", ["_id", "name", "email"])
            .populate("category", ["_id", "title"]);
        if (!Blog) {
            throw createError("Blog not found", 404);
        }
        res.json({
            result: Blog,
            message: "Blog detail fetched",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const ListAllBlogs = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        let filter = {};
        if (req.query.search) {
            filter = {
                title: new RegExp(String(req.query.search), "i"),
            };
        }
        const count = await blog.countDocuments(filter);
        const data = await blog
            .find(filter)
            .populate("author", ["_id", "name", "email"])
            .populate("category", ["_id", "title"])
            .sort({ _id: "desc" })
            .limit(limit)
            .skip(skip);
        res.json({
            result: data,
            message: "product list all",
            meta: {
                currentPage: page,
                total: count,
                limit: limit,
            },
        });
    }
    catch (exception) {
        next(exception);
    }
};
const AllBlogsFiltering = async (req, res, next) => {
    try {
        const query = req.query;
        const queryObj = { ...query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        let allBlogs = blog.find(JSON.parse(queryStr));
        if (query.fields) {
            const fields = query.fields.split(",").join(" ");
            allBlogs = allBlogs.select(fields);
        }
        //Pagination
        const page = query.page;
        const limit = query.limit;
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        if (query.page) {
            allBlogs = allBlogs.skip(skip).limit(limitNum);
            const BlogCount = await blog.countDocuments();
            if (skip >= BlogCount) {
                throw createError("This page does not exist", 404);
            }
        }
        const result = await allBlogs;
        res.json({
            result,
            message: "Blogs filtered",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const BlogUpdateById = async (req, res, next) => {
    try {
        const data = req.body;
        if (data.title) {
            data.slug = slugify(data.title);
        }
        const BlogUpdate = await blog.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
        if (!BlogUpdate) {
            throw createError("Blog not found", 404);
        }
        res.json({
            result: BlogUpdate,
            message: "Blog updated",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const BlogDeleteById = async (req, res, next) => {
    try {
        const BlogDelete = await blog.findByIdAndDelete(req.params.id);
        if (!BlogDelete) {
            throw createError("Blog not found", 404);
        }
        res.json({
            result: BlogDelete,
            message: "Blog deleted",
            meta: null,
        });
    }
    catch (exception) {
        next(exception);
    }
};
const GetMyBlogs = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw createError("Unauthorized", 401);
        }
        const data = await blog
            .find({ author: userId })
            .populate("author", ["_id", "name", "email"])
            .populate("category", ["_id", "title"])
            .sort({ _id: "desc" });
        res.json({
            result: data,
            message: "User blogs fetched",
            meta: { total: data.length },
        });
    }
    catch (exception) {
        next(exception);
    }
};
export { createBlog, BlogDetailById, BlogDetailBySlug, ListAllBlogs, AllBlogsFiltering, BlogUpdateById, BlogDeleteById, GetMyBlogs, };
