import slugify from "slugify";
import blog from "./blog.model";
import { Request, Response, NextFunction } from "express";
import categoryModel from "../categories/category.model";
interface IBlog {
  title: string;
  content: string;
  slug: string;
  category: string;
  status: "draft" | "published" | "unpublished";
  image?: string;
}

interface AppError extends Error {
  status?: number;
}

const createError = (message: string, status = 500): AppError => {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
};

async function generateUniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  while (await blog.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    if (data.title) {
      data.slug = await generateUniqueSlug(data.title);
    }

    if (req.file) {
      data.image = req.file.filename;
    }

    if (!data.title || !data.category || !data.description) {
      return res.status(400).json({ message: "Invalid request" });
    }


    const newBlog = await blog.create(data);

    res.json({
      result: newBlog,
      message: "Blog submitted for review",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const BlogDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const blogId = req.params.id;
    const Blog = await blog
      .findById(req.params.id)
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog) {
      throw createError("Blog not found", 404);
    }

    if (Blog.status === "draft") {
      const isAuthor = req.user && req.user.id === Blog.author?._id?.toString();
      if (!isAuthor) {
        throw createError("Blog not found", 404);
      }
    }

    res.json({
      result: Blog,
      message: "Blog detail fetched",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};


const BlogDetailBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const Blog = await blog
      .findOne({ slug: req.params.slug })
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog) {
      throw createError("Blog not found", 404);
    }

    if (Blog.status === "draft") {
      const isAuthor = req.user && req.user.id === Blog.author?._id?.toString();

      if (!isAuthor) {
        throw createError("Blog not found", 404);
      }
    }

    res.json({
      result: Blog,
      message: "Blog detail fetched",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ListAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    console.log(req.query);

    const filter: Record<string, any> = {};

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.title = new RegExp(escapeRegex(req.query.search.trim()), "i");
    }

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      console.log(req.query.category);
      const matched = await categoryModel
        .find({
          title: new RegExp(`^${escapeRegex(req.query.category.trim())}$`, "i"),
        })
        .select("_id")
        .lean();

      filter.category = { $in: matched.map((c) => c._id) };
    }

    if (req.user) {
      filter.$or = [
        { status: "published" },
        { status: "draft", author: req.user.id },
      ];
    } else {
      filter.status = "published";
    }

    const [count, data] = await Promise.all([
      blog.countDocuments(filter),
      blog
        .find(filter)
        .populate("author", ["_id", "name"])
        .populate("category", ["_id", "title"])
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      result: data,
      message: "Blogs fetched",
      meta: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalBlogs: count,
        limit,
      },
    });
  } catch (exception) {
    next(exception);
  }
};
const AllBlogsFiltering = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query;
    const queryObj = { ...query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsedQuery = JSON.parse(queryStr);

    if (req.user) {
      parsedQuery.$or = [
        { status: "published" },
        { status: "draft", author: req.user.id },
      ];
    } else {
      parsedQuery.status = "published";
    }

    let allBlogs = blog.find(parsedQuery);

    if (query.fields) {
      const fields = (query.fields as string).split(",").join(" ");
      allBlogs = allBlogs.select(fields);
    }

    const page = query.page;
    const limit = query.limit;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (query.page) {
      allBlogs = allBlogs.skip(skip).limit(limitNum);
      const BlogCount = await blog.countDocuments(parsedQuery);
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
  } catch (exception) {
    next(exception);
  }
};

const BlogUpdateBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const existing = await blog.findOne({ slug: req.params.slug });

    if (!existing) {
      throw createError("Blog not found", 404);
    }


    if (
      req.user &&
      existing.author.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      throw createError("Not authorized to modify this blog", 403);
    }

    const data = req.body;

    delete data.slug;

    if (req.file) {
      data.image = req.file.filename;
    }

    const BlogUpdate = await blog.findByIdAndUpdate(
      existing._id,
      { $set: data },
      { new: true },
    );

    res.json({
      result: BlogUpdate,
      message: "Blog updated",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};
const UnpublishBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw createError("Not authorized for this action", 403);
    }

    const BlogUnpublish = await blog.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "unpublished" } },
      { new: true },
    );

    if (!BlogUnpublish) {
      throw createError("Blog not found", 404);
    }

    res.json({
      result: BlogUnpublish,
      message: "Blog unpublished",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const BlogDeleteById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
  } catch (exception) {
    next(exception);
  }
};

const GetMyBlogs = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (exception) {
    next(exception);
  }
};

const AdminListAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      status: { $ne: "draft" },
    };

    if (req.query.search) {
      filter.title = new RegExp(String(req.query.search), "i");
    }

    const count = await blog.countDocuments(filter);

    const data = await blog
      .find(filter)
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"])
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip);

    res.status(200).json({
      result: data,
      message: "Blogs fetched",
      meta: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalBlogs: count,
        limit,
      },
    });
  } catch (exception) {
    next(exception);
  }
};

export {
  createBlog,
  BlogDetailById,
  BlogDetailBySlug,
  ListAllBlogs,
  AllBlogsFiltering,
  BlogUpdateBySlug,
  UnpublishBlogById,
  BlogDeleteById,
  GetMyBlogs,
  AdminListAllBlogs,
};
