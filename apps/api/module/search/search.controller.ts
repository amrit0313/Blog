import { Request, Response, NextFunction } from "express";

import blog from "../blog/blog.model";
import { User } from "../user/user.model";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const USER_LIMIT = 5;
const BLOG_LIMIT = 10;
const AUTHOR_MATCH_LIMIT = 20;
const EXCERPT_LENGTH = 160;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripHtml = (html = "") =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Short plain-text preview: around the first match if there is one, else the start
const buildExcerpt = (html: string | undefined, term: string) => {
  const text = stripHtml(html);
  if (!text) return "";

  const index = text.toLowerCase().indexOf(term.toLowerCase());
  const start = index > 40 ? index - 40 : 0;
  const end = start + EXCERPT_LENGTH;

  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
};

/**
 * Searches people and blogs in one request.
 * GET /api/search?q=term
 * Public: only published/featured blogs and non-sensitive user fields are returned.
 */
const SearchAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const q = raw.slice(0, MAX_QUERY_LENGTH);

    if (q.length < MIN_QUERY_LENGTH) {
      return res.status(200).json({
        result: { users: [], blogs: [] },
        message: "Search results",
        meta: null,
      });
    }

    const re = new RegExp(escapeRegex(q), "i");

    const matchedUsers: any[] = await User.find({ name: re })
      .select("_id name email")
      .populate({ path: "profile", select: "avatar " })
      .limit(AUTHOR_MATCH_LIMIT)
      .lean();

    const users = matchedUsers.slice(0, USER_LIMIT).map((u) => ({
      _id: u._id,
      name: u.name,
      avatar: u.profile?.avatar ?? null,
      isVerified: u.profile?.isVerified ?? false,
    }));

    const rows: any[] = await blog
      .find({
        status: { $in: ["published", "featured"] },
        $or: [
          { title: re },
          { description: re },
          { tags: re },
          { author: { $in: matchedUsers.map((u) => u._id) } },
        ],
      })
      .select("title slug description tags image author category createdAt updatedAt")
      .populate({
        path: "author",
        select: "_id name",
        populate: { path: "profile", select: "avatar" },
      })
      .populate("category", "_id title")
      .sort({ _id: -1 })
      .limit(BLOG_LIMIT)
      .lean();

    const blogs = rows.map(({ description, ...rest }) => ({
      ...rest,
      excerpt: buildExcerpt(description, q),
    }));

    return res.status(200).json({
      result: { users, blogs },
      message: "Search results",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

export { SearchAll };