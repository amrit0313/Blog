"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./avatar";
import CommentItem from "./CommentItem";
import type { Comment } from "../lib/comment";
import { commentApi } from "../lib/comment";
import { toast } from "sonner";
import { HiPaperAirplane } from "react-icons/hi2";
import { useRouter } from "next/navigation";

interface CommentSectionProps {
  blogId: string;
  isOpen?: boolean; // if undefined/true, renders. If false, not rendered or collapsed.
  alwaysOpen?: boolean; // e.g. for detail page
  onCommentCountChange?: (count: number) => void;
  className?: string;
}

export default function CommentSection({
  blogId,
  isOpen = true,
  alwaysOpen = false,
  onCommentCountChange,
  className = "",
}: CommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(alwaysOpen);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await commentApi.list(blogId);
      const fetched = response.result ?? [];
      setComments(fetched);
      setHasLoaded(true);
      onCommentCountChange?.(response.meta?.total ?? fetched.length);
    } catch {
      toast.error("Failed to load comments.");
    } finally {
      setIsLoading(false);
    }
  }, [blogId, onCommentCountChange]);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      void fetchComments();
    }
  }, [isOpen, hasLoaded, fetchComments]);

  if (!isOpen) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to leave a comment.");
      router.push("/login");
      return;
    }

    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    if (trimmed.length > 2000) {
      toast.error("Comment must be 2,000 characters or less.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await commentApi.create(blogId, trimmed);
      const newComment = response.result;
      setComments((prev) => {
        const next = [newComment, ...prev];
        onCommentCountChange?.(next.length);
        return next;
      });
      setNewCommentText("");
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => {
      const next = prev.filter((c) => c._id !== commentId);
      onCommentCountChange?.(next.length);
      return next;
    });
  };

  const visibleComments =
    showAll || alwaysOpen || comments.length <= 2
      ? comments
      : comments.slice(0, 2);

  return (
    <div className={`space-y-4 pt-3 ${className}`}>
      {/* Input box */}
      <form onSubmit={handlePostComment} className="flex items-start gap-2.5">
        <Avatar
          name={user?.name ?? "Guest"}
          className="h-8 w-8 text-xs shrink-0 mt-0.5"
          fallback="initials"
        />
        <div className="relative flex-1">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            maxLength={2000}
            rows={1}
            placeholder={user ? "Write a comment..." : "Log in to join the conversation..."}
            disabled={isSubmitting}
            onFocus={() => {
              if (!user) {
                toast.error("Please log in to leave a comment.");
                router.push("/login");
              }
            }}
            className="w-full resize-none rounded-2xl border border-border bg-background py-2 pl-3.5 pr-11 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handlePostComment(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            aria-label="Send comment"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            <HiPaperAirplane className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2.5 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-10 w-3/4 rounded-2xl bg-muted" />
                <div className="h-3 w-20 rounded bg-muted ml-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && hasLoaded && comments.length === 0 && (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No comments yet. Be the first to join the conversation!
        </div>
      )}

      {/* Comments List */}
      {!isLoading && visibleComments.length > 0 && (
        <div className="space-y-3 pt-1">
          {visibleComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              blogId={blogId}
              currentUser={user}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}

      {/* "View all comments" link in feed mode */}
      {!alwaysOpen && !showAll && comments.length > 2 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors pl-10"
        >
          View all {comments.length} comments
        </button>
      )}
    </div>
  );
}
