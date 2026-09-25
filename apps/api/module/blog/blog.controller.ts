import slugify from "slugify";
import blog from "./blog.model";
import { Request, Response, NextFunction } from "express";

interface IBlog {
  title: string;
  content: string;
  slug: string;
  category: string;
  status: "draft" | "published";
}

interface ListBlogsParams {
  skip?: number;
  limit?: number;
  filter?: Record<string, any>;
}

interface AppError extends Error {
  status?: number;
}

const createError = (message: string, status = 500): AppError => {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
};

const createBlog = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (exception) {
    next(exception);
  }
};

const BlogDetailById = async (id: string) => {
  try {
    const Blog = await blog
      .findById(id)
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog) {
      throw createError("Blog not found", 404);
    }
    return Blog;
  } catch (exception) {
    throw exception;
  }
};

const BlogDetailBySlug = async (slug: string) => {
  try {
    const Blog = await blog
      .findOne({ slug })
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog) {
      throw createError("Blog not found", 404);
    }
    return Blog;
  } catch (exception) {
    throw exception;
  }
};

const ListAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = {};
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
  } catch (exception) {
    next(exception);
  }
};

const AllBlogsFiltering = async (req: Request) => {
  try {
    const query = req.query;
    const queryObj = { ...query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let allBlogs = blog.find(JSON.parse(queryStr));

    if (query.fields) {
      const fields = (query.fields as string).split(",").join(" ");
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
    return allBlogs;
  } catch (exception) {
    throw exception;
  }
};

const BlogUpdateById = async (id: string, data: IBlog) => {
  try {
    if (data.title) {
      data.slug = slugify(data.title);
    }
    const BlogUpdate = await blog.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    );

    if (!BlogUpdate) {
      throw createError("Blog not found", 404);
    }

    return BlogUpdate;
  } catch (exception) {
    throw exception;
  }
};

const BlogDeleteById = async (id: string) => {
  try {
    const BlogDelete = await blog.findByIdAndDelete(id);

    if (!BlogDelete) {
      throw createError("Blog not found", 404);
    }

    return BlogDelete;
  } catch (exception) {
    throw exception;
  }
};

export {
  createBlog,
  BlogDetailById,
  BlogDetailBySlug,
  ListAllBlogs,
  AllBlogsFiltering,
  BlogUpdateById,
  BlogDeleteById,
};
