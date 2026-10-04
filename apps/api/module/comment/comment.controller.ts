// comment.controller.ts
import { Request, Response, NextFunction } from "express";
import Comment from "./comment.model";
import blog from "../blog/blog.model";

/**
 * Creates an application error with an HTTP status code for Express error handling.
 *
 * @param {string} message - Description of the error.
 * @param {number} [status=500] - HTTP status code to attach to the error.
 * @returns {Error & { status?: number }} Error instance carrying the specified status.
 */
const createError = (message: string, status = 500) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
};

/**
 * Adds a comment to a blog on behalf of the authenticated user.
 *
 * @param {Request} req - Request containing `blogId`, comment `content`, and authenticated user context.
 * @param {Response} res - Express response used to return the created comment.
 * @param {NextFunction} next - Express error handler for validation, lookup, and persistence failures.
 * @returns {Promise<void>} Resolves after sending the created comment or forwarding an error.
 *
 * @example
 * POST /api/blog/65a1f23b4c5d6e7f89012345/comments
 * Authorization: Bearer <access-token>
 * Content-Type: application/json
 * { "content": "Wow" }
 */

const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    const { blogId } = req.params;

    if (!content?.trim()) throw createError("Comment content is required", 400);

    const blogExists = await blog.exists({ _id: blogId });
    if (!blogExists) throw createError("Blog not found", 404);

    const comment: any = await Comment.create({
      blog: String(blogId),
      user: req.user!.id,
      content: content.trim(),
    });

    const populated = await Comment.findById(comment._id).populate("user", ["_id", "name", "email"]);

    res.status(201).json({ result: populated, message: "Comment added", meta: null });
  } catch (exception) {
    next(exception);
  }
};


/**
 * Lists a blog's comments with user details and replies, newest first.
 *
 * @param {Request} req - Request containing the blog ID in `params.blogId`.
 * @param {Response} res - Express response used to return the comment list and count.
 * @param {NextFunction} next - Express error handler for retrieval failures.
 * @returns {Promise<void>} Resolves after sending the comments or forwarding an error.
 *
 * @example
 * GET /api/blog/65a1f23b4c5d6e7f89012345/comments
 */

const listComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await Comment.find({ blog: req.params.blogId })
      .populate("user", ["_id", "name", "email"])
      .populate("replies.user", ["_id", "name", "email"])
      .sort({ createdAt: -1 });

    res.json({
      result: comments,
      message: "Comments fetched",
      meta: { total: comments.length },
    });
  } catch (exception) {
    next(exception);
  }
};


/**
 * Adds a reply to a comment on behalf of the authenticated user.
 *
 * @param {Request} req - Request containing `commentId`, reply `content`, and authenticated user context.
 * @param {Response} res - Express response used to return the updated comment with its reply.
 * @param {NextFunction} next - Express error handler for validation, lookup, and persistence failures.
 * @returns {Promise<void>} Resolves after sending the updated comment or forwarding an error.
 *
 * @example
 * POST /api/blog/65a1f23b4c5d6e7f89012345/comments/65a1f23b4c5d6e7f89012346/replies
 * Authorization: Bearer <access-token>
 * Content-Type: application/json
 * { "content": "abcd" }
 */

const addReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw createError("Reply content is required", 400);

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) throw createError("Comment not found", 404);

    comment.replies.push({
      user: req.user!.id,
      content: content.trim(),
    } as any);

    await comment.save();
    await comment.populate("user", ["_id", "name", "email"]);
    await comment.populate("replies.user", ["_id", "name", "email"]);

    res.status(201).json({ result: comment, message: "Reply added", meta: null });
  } catch (exception) {
    next(exception);
  }
};


/**
 * Deletes a comment when requested by its author or an administrator.
 *
 * @param {Request} req - Request containing `commentId` and authenticated user context.
 * @param {Response} res - Express response used to confirm deletion.
 * @param {NextFunction} next - Express error handler for lookup, authorization, and deletion failures.
 * @returns {Promise<void>} Resolves after confirming deletion or forwarding an error.
 *
 * @example
 * DELETE /api/blog/65a1f23b4c5d6e7f89012345/comments/65a1f23b4c5d6e7f89012346
 * Authorization: Bearer <access-token>
 */

const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) throw createError("Comment not found", 404);

    const isOwner = comment.user.toString() === req.user!.id;
    const isAdmin = req.user!.role === "admin";
    if (!isOwner && !isAdmin) throw createError("Not authorized", 403);

    await comment.deleteOne();

    res.json({ result: null, message: "Comment deleted", meta: null });
  } catch (exception) {
    next(exception);
  }
};


/**
 * Deletes a reply when requested by its author or an administrator.
 *
 * @param {Request} req - Request containing `commentId`, `replyId`, and authenticated user context.
 * @param {Response} res - Express response used to return the updated comment.
 * @param {NextFunction} next - Express error handler for lookup, authorization, and deletion failures.
 * @returns {Promise<void>} Resolves after sending the updated comment or forwarding an error.
 *
 * @example
 * DELETE /api/blog/65a1f23b4c5d6e7f89012345/comments/65a1f23b4c5d6e7f89012346/replies/65a1f23b4c5d6e7f89012347
 * Authorization: Bearer <access-token>
 */

const deleteReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) throw createError("Comment not found", 404);

 const reply = comment.replies.id(String(req.params.replyId));
    if (!reply) throw createError("Reply not found", 404);

    const isOwner = reply.user.toString() === req.user!.id;
    const isAdmin = req.user!.role === "admin";
    if (!isOwner && !isAdmin) throw createError("Not authorized", 403);

    reply.deleteOne();
    await comment.save();

    res.json({ result: comment, message: "Reply deleted", meta: null });
  } catch (exception) {
    next(exception);
  }
};

export { createComment, listComments, addReply, deleteComment, deleteReply };