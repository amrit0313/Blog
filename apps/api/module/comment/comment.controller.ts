// comment.controller.ts
import { Request, Response, NextFunction } from "express";
import Comment from "./comment.model";
import blog from "../blog/blog.model";

const createError = (message: string, status = 500) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
};

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