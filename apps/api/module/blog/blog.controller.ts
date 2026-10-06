import slugify from "slugify";
import blog from "./blog.model";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import categoryModel from "../categories/category.model";
import { User } from "../user/user.model";
import { BlogType } from "./blog.model";

interface IBlog {
  title: string;
  content: string;
  slug: string;
  category: string;
  status: "draft" | "published" | "unpublished" | "submitted" | "rejected";
  image?: string;
}
import { storage } from "../../storage";

interface AppError extends Error {
  status?: number;
}

/**
 * Creates an application error with an HTTP status code for Express error handling.
 * @param {string} message Description of the error.
 * @param {number} [status=500] HTTP status code to attach to the error.
 * @returns {AppError} Error instance with its status set.
 */
const createError = (message: string, status = 500): AppError => {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
};

/**
 * Generates a unique URL slug from a blog title.
 * @param {string} title Blog title used as the slug source.
 * @param {string} [excludeId] Blog ID to ignore when checking uniqueness during updates.
 * @returns {Promise<string>} A slug that is not used by another blog.
 */
async function generateUniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  while (
    await blog.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

/**
 * Creates a blog post or saves it as a draft for the authenticated user.
 * @param {Request} req Express request containing blog fields, an optional image, and the authenticated user.
 * @param {Response} res Express response used to return the created blog or a validation error.
 * @param {NextFunction} next Express error handler for unexpected failures.
 * @returns Resolves after sending the response or forwarding an error to Express.
 */
const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  let uploaded: { key: string; url: string } | null = null;

  try {
    const { title, category, description, status, tags } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: "Invalid request" });
    }
    if (status !== "draft" && status !== "submitted") {
      return res.status(400).json({ message: "Invalid blog status" });
    }
    let slug;
    if (title) {
      slug = await generateUniqueSlug(title);
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (req?.file) {
      uploaded = await storage.upload(req?.file, { folder: "blogs" });
    }

    const parsedTags =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : Array.isArray(tags)
          ? tags
          : [];

    const newBlog = await blog.create({
      title,
      description,
      category,
      slug,
      author: req.user!.id,
      status: status ?? "draft",
      image: uploaded ?? undefined,
      tags: parsedTags,
    });

    res.status(201).json({
      result: newBlog,
      message:
        newBlog.status === "draft"
          ? "Blog saved as draft"
          : "Blog submitted for review",
      meta: null,
    });
  } catch (exception) {
    if (uploaded) await storage.delete(uploaded.key).catch(console.error);
    next(exception);
  }
};

/**
 * Retrieves a blog by ID, allowing drafts only for their author.
 * @param {Request} req Express request containing the blog ID in `params.id` and optional user context.
 * @param {Response} res Express response used to return the blog details.
 * @param {NextFunction} next Express error handler for lookup and authorization failures.
 * @returns Resolves after sending the blog details or forwarding an error to Express.
 */
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

/**
 * Retrieves a blog by slug, allowing drafts only for their author.
 * @param {Request} req Express request containing the slug in `params.slug` and optional user context.
 * @param {Response} res Express response used to return the blog details.
 * @param {NextFunction} next Express error handler for lookup and authorization failures.
 * @returns Resolves after sending the blog details or forwarding an error to Express.
 */
const BlogDetailBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Fetch without incrementing yet, so we can run the draft check first
    const Blog = await blog
      .findOne({ slug: req.params.slug })
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog) {
      throw createError("Blog not found", 404);
    }

    const isAuthor = req.user && req.user.id === Blog.author?._id?.toString();

    if (Blog.status === "draft" && !isAuthor) {
      throw createError("Blog not found", 404);
    }

    // 2. Count the view only for published posts and non-authors
    if (
      (Blog.status === "published" || Blog.status === "featured") &&
      !isAuthor
    ) {
      await blog.updateOne({ _id: Blog._id }, { $inc: { views: 1 } });
      Blog.views = (Blog.views ?? 0) + 1; // reflect the new count in the response
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

/**
 * Retrieves a draft by slug for its authenticated author.
 * @param {Request} req Express request containing the slug in `params.slug` and authenticated user context.
 * @param {Response} res Express response used to return the draft details.
 * @param {NextFunction} next Express error handler for lookup and authorization failures.
 * @returns Resolves after sending the draft details or forwarding an error to Express.
 */

const DraftBlogDetailBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const Blog = await blog
      .findOne({ slug: req.params.slug, status: "draft" })
      .populate("author", ["_id", "name", "email"])
      .populate("category", ["_id", "title"]);

    if (!Blog || req.user?.id !== Blog.author?._id?.toString()) {
      throw createError("Blog not found", 404);
    }

    res.json({
      result: Blog,
      message: "Draft detail fetched",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

/**
 * Escapes regular-expression metacharacters in a string.
 * @param {string} s Input string to escape.
 * @returns {string} String safe to use as a literal regular-expression pattern.
 */

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeSnippet = (text = "", term: string, size = 80) => {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i === -1) return "";
  const start = Math.max(0, i - size);
  const end = Math.min(text.length, i + term.length + size);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
};

/**
 * Lists visible blogs with optional title/category filters and pagination.
 * @param {Request} req Express request containing query filters, pagination, and optional user context.
 * @param {Response} res Express response used to return blog results and pagination metadata.
 * @param {NextFunction} next Express error handler for database or query failures.
 * @returns Resolves after sending the result page or forwarding an error to Express.
 */

const ListAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const conditions: Record<string, any>[] = [];

    if (req.user) {
      conditions.push({
        $or: [
          { status: { $in: ["published", "featured"] } },
          { status: "draft", author: req.user.id },
        ],
      });
    } else {
      conditions.push({ status: { $in: ["published", "featured"] } });
    }

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const re = new RegExp(escapeRegex(search), "i");
      const matchedAuthors = await User.find({ name: re }).select("_id").lean();
      conditions.push({
        $or: [
          { title: re },
          { description: re },
          { author: { $in: matchedAuthors.map((u: any) => u._id) } },
          {tags:re}
        ],
      });
    }

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      const matched = await categoryModel
        .find({
          title: new RegExp(`^${escapeRegex(req.query.category.trim())}$`, "i"),
        })
        .select("_id")
        .lean();
      conditions.push({ category: { $in: matched.map((c) => c._id) } });
    }

    if (typeof req.query.tag === "string" && req.query.tag.trim()) {
      conditions.push({
        tags: new RegExp(escapeRegex(req.query.tag.trim().toLowerCase()), "i"),
      });
    }

    const filter = { $and: conditions };

    const [count, rows] = await Promise.all([
      blog.countDocuments(filter),
      blog
        .find(filter)
        .populate({
          path: "author",
          select: "_id name",
          populate: { path: "profile", select: "avatar" },
        })
        .populate("category", ["_id", "title"])
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // send a short matching snippet instead of the whole body
    const data = rows.map(({ body, ...rest }: any) => ({
      ...rest,
      ...(search && { snippet: makeSnippet(body, search) }),
    }));

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

/**
 * Filters blogs using query-string fields, with access limited by the current user's visibility.
 * @param {Request} req Express request containing filter, field selection, pagination, and optional user context.
 * @param {Response} res Express response used to return the filtered blogs.
 * @param {NextFunction} next Express error handler for invalid queries and database failures.
 * @returns Resolves after sending the filtered result or forwarding an error to Express.
 */

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
        { status: { $in: ["published", "featured"] } },
        { status: "draft", author: req.user.id },
      ];
    } else {
      parsedQuery.status = { $in: ["published", "featured"] };
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

/**
 * Updates a blog selected by slug, enforcing author/admin permissions and optionally replacing its image.
 * @param {Request} req Express request containing the slug, update fields, optional image, and user context.
 * @param {Response} res Express response used to return the updated blog.
 * @param {NextFunction} next Express error handler for lookup, authorization, or update failures.
 * @returns Resolves after sending the updated blog or forwarding an error to Express.
 */

const BlogUpdateBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploaded: { key: string; url: string } | null = null;

  try {
    const existing = await blog.findOne({ slug: req.params.slug });

    if (!existing) {
      throw createError("Blog not found", 404);
    }

    if (!req.user) {
      throw createError("Not authorized to modify this blog", 401);
    }

    if (
      existing.author.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      throw createError("Not authorized to modify this blog", 403);
    }

    const data = req.body;

    delete data.slug;

    if (data.tags !== undefined) {
      data.tags =
        typeof data.tags === "string"
          ? data.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : Array.isArray(data.tags)
            ? data.tags
            : [];
    }

    if (req.file) {
      uploaded = await storage.upload(req.file, { folder: "blogs" });
      data.image = uploaded;
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
    if (uploaded) await storage.delete(uploaded.key).catch(console.error);
    next(exception);
  }
};

/**
 * Changes a blog's status to unpublished; administrators only.
 * @param {Request} req Express request containing the blog ID in `params.id` and authenticated user context.
 * @param {Response} res Express response used to return the updated blog.
 * @param {NextFunction} next Express error handler for authorization, lookup, or update failures.
 * @returns Resolves after sending the updated blog or forwarding an error to Express.
 */

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

/**
 * Deletes a blog by ID.
 * @param {Request} req Express request containing the blog ID in `params.id`.
 * @param {Response} res Express response used to return the deleted blog.
 * @param {NextFunction} next Express error handler for lookup or deletion failures.
 * @returns Resolves after sending the deleted blog or forwarding an error to Express.
 */

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

/**
 * Lists all blogs owned by the authenticated user.
 * @param {Request} req Express request containing authenticated user context.
 * @param {Response} res Express response used to return the user's blogs and count.
 * @param {NextFunction} next Express error handler for authorization or database failures.
 * @returns Resolves after sending the user's blogs or forwarding an error to Express.
 */

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

/**
 * Lists published blogs by author with pagination.
 * @param {Request} req Express request containing the author ID in `params.authorId` and optional pagination query values.
 * @param {Response} res Express response used to return the author's published blogs and pagination metadata.
 * @param {NextFunction} next Express error handler for invalid IDs or database failures.
 * @returns Resolves after sending the result page or forwarding an error to Express.
 */

const GetBlogsByAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { authorId } = req.params;
    if (!mongoose.isValidObjectId(authorId)) {
      throw createError("Invalid author ID", 400);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      author: authorId,
      status: { $in: ["published", "featured"] },
    };

    const [count, data] = await Promise.all([
      blog.countDocuments(filter),
      blog
        .find(filter)
        .populate("author", ["_id", "name", "email"])
        .populate("category", ["_id", "title"])
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      result: data,
      message: "Author blogs fetched",
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

/**
 * Lists non-draft blogs for the admin page with title, author, status, and tag filters.
 * @param {Request} req Express request containing pagination and optional title, author, status, and tag query filters.
 * @param {Response} res Express response used to return the matching blogs and pagination metadata.
 * @param {NextFunction} next Express error handler for query or database failures.
 * @returns Resolves after sending the result page or forwarding an error to Express.
 */

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
      filter.title = new RegExp(
        escapeRegex(String(req.query.search).trim()),
        "i",
      );
    }

    if (req.query.author) {
      const authorSearch = new RegExp(
        escapeRegex(String(req.query.author).trim()),
        "i",
      );
      const matchingAuthors = await User.find({
        $or: [{ name: authorSearch }, { email: authorSearch }],
      })
        .select("_id")
        .lean();
      filter.author = { $in: matchingAuthors.map((author) => author._id) };
    }

    const allowedStatuses = [
      "submitted",
      "published",
      "featured",
      "unpublished",
      "rejected",
    ];
    if (
      typeof req.query.status === "string" &&
      allowedStatuses.includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    const tagConditions: Record<string, any>[] = [];
    if (typeof req.query.tags === "string" && req.query.tags.trim()) {
      const tagList = req.query.tags
        .split(",")
        .map((t) => t.trim().toLowerCase());
      tagConditions.push({ tags: { $in: tagList } });
    }
    if (typeof req.query.tag === "string" && req.query.tag.trim()) {
      tagConditions.push({
        tags: new RegExp(escapeRegex(req.query.tag.trim().toLowerCase()), "i"),
      });
    }
    if (tagConditions.length === 1) {
      Object.assign(filter, tagConditions[0]);
    } else if (tagConditions.length > 1) {
      filter.$and = tagConditions;
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

// add to blog.controller.ts

// PUT /api/blog/:id/like  (toggle like on/off)
/**
 * Toggles the authenticated user's like on a blog.
 * @param {Request} req Express request containing the blog ID in `params.id` and authenticated user context.
 * @param {Response} res Express response used to return the updated like count and liked state.
 * @param {NextFunction} next Express error handler for lookup or persistence failures.
 * @returns Resolves after sending the like state or forwarding an error to Express.
 */

const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const targetBlog = await blog.findById(req.params.id);

    if (!targetBlog) throw createError("Blog not found", 404);

    const alreadyLiked = targetBlog.likes.some(
      (id) => id.toString() === userId,
    );

    if (alreadyLiked) {
      targetBlog.likes = targetBlog.likes.filter(
        (id) => id.toString() !== userId,
      );
    } else {
      targetBlog.likes.push(userId as any);
    }

    await targetBlog.save();

    res.json({
      result: { likesCount: targetBlog.likes.length, liked: !alreadyLiked },
      message: alreadyLiked ? "Like removed" : "Blog liked",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

export {
  createBlog,
  BlogDetailById,
  BlogDetailBySlug,
  DraftBlogDetailBySlug,
  ListAllBlogs,
  AllBlogsFiltering,
  BlogUpdateBySlug,
  UnpublishBlogById,
  BlogDeleteById,
  GetMyBlogs,
  GetBlogsByAuthor,
  AdminListAllBlogs,
  toggleLike,
};
