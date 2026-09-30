"use client";

import { useState } from "react";
import Avatar from "./avatar";
import type { Comment, Reply } from "../lib/comment";
import type { AuthUser } from "../types/auth";
import { commentApi } from "../lib/comment";
import { toast } from "sonner";
import { HiTrash, HiArrowUturnLeft, HiPaperAirplane } from "react-icons/hi2";
import { useRouter } from "next/navigation";

function formatRelative(value?: string) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface CommentItemProps {
  comment: Comment;
  blogId: string;
  currentUser: AuthUser | null;
  onCommentUpdated: (updatedComment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  currentUser,
  onCommentUpdated,
  onCommentDeleted,
}: CommentItemProps) {
  const router = useRouter();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  const commentUser = comment.user || comment.author;
  const isOwner = Boolean(
    currentUser?.id && commentUser?._id && String(currentUser.id) === String(commentUser._id)
  );
  const isAdmin = currentUser?.role === "admin";
  const canDeleteComment = isOwner || isAdmin;

  const handleOpenReply = () => {
    if (!currentUser) {
      toast.error("Please log in to reply.");
      router.push("/login");
      return;
    }
    setShowReplyInput((prev) => !prev);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in to reply.");
      router.push("/login");
      return;
    }

    const trimmed = replyText.trim();
    if (!trimmed) return;

    if (trimmed.length > 1000) {
      toast.error("Reply must be 1,000 characters or less.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await commentApi.addReply(comment._id, trimmed);
      onCommentUpdated(response.result);
      setReplyText("");
      setShowReplyInput(false);
      toast.success("Reply added");
    } catch {
      toast.error("Failed to post reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!canDeleteComment) return;
    const confirmed = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await commentApi.delete(comment._id);
      onCommentDeleted(comment._id);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this reply?");
    if (!confirmed) return;

    setDeletingReplyId(replyId);
    try {
      const response = await commentApi.deleteReply(comment._id, replyId);
      onCommentUpdated(response.result);
      toast.success("Reply deleted");
    } catch {
      toast.error("Failed to delete reply.");
    } finally {
      setDeletingReplyId(null);
    }
  };

  return (
    <div className="group flex flex-col gap-2">
      {/* Top-level comment */}
      <div className="flex items-start gap-2.5">
        <Avatar
          name={commentUser?.name ?? "User"}
          className="h-8 w-8 text-xs shrink-0 mt-0.5"
          fallback="initials"
        />
        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="inline-block max-w-full rounded-2xl bg-muted/80 px-3.5 py-2 text-sm text-foreground">
            <div className="font-semibold text-xs text-foreground truncate">
              {commentUser?.name ?? "Anonymous"}
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">
              {comment.content}
            </p>
          </div>

          {/* Action row under bubble */}
          <div className="mt-1 flex items-center gap-3 pl-2 text-xs text-muted-foreground">
            <span>{formatRelative(comment.createdAt)}</span>

            <button
              type="button"
              onClick={handleOpenReply}
              className="font-semibold hover:text-primary hover:underline"
            >
              Reply
            </button>

            {canDeleteComment && (
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="text-red-500 font-medium hover:text-red-600 hover:underline disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-2.5 border-l-2 border-border/60 pl-3">
          {comment.replies.map((reply: Reply) => {
            const replyUser = reply.user || reply.author;
            const canDeleteThisReply =
              Boolean(currentUser?.id && replyUser?._id && String(currentUser.id) === String(replyUser._id)) ||
              isAdmin;

            return (
              <div key={reply._id} className="flex items-start gap-2">
                <Avatar
                  name={replyUser?.name ?? "User"}
                  className="h-6 w-6 text-[10px] shrink-0 mt-0.5"
                  fallback="initials"
                />
                <div className="flex-1 min-w-0">
                  <div className="inline-block max-w-full rounded-2xl bg-muted/70 px-3 py-1.5 text-xs text-foreground">
                    <div className="font-semibold text-[11px] text-foreground truncate">
                      {replyUser?.name ?? "Anonymous"}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-foreground/90">
                      {reply.content}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 pl-2 text-[11px] text-muted-foreground">
                    <span>{formatRelative(reply.createdAt)}</span>
                    {canDeleteThisReply && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReply(reply._id)}
                        disabled={deletingReplyId === reply._id}
                        className="text-red-500 hover:text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingReplyId === reply._id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Reply Input */}
      {showReplyInput && (
        <form onSubmit={handlePostReply} className="ml-10 mt-1 flex items-start gap-2">
          <Avatar
            name={currentUser?.name ?? "You"}
            className="h-6 w-6 text-[10px] shrink-0 mt-1"
            fallback="initials"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={1000}
              placeholder={`Reply to ${commentUser?.name ?? "comment"}...`}
              disabled={isSubmittingReply}
              className="w-full rounded-full border border-border bg-background py-1.5 pl-3.5 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSubmittingReply || !replyText.trim()}
              aria-label="Send reply"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              <HiPaperAirplane className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
