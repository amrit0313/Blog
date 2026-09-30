"use client";

import { useState } from "react";
import { FaThumbsUp, FaRegThumbsUp } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { blogApi } from "../lib/blog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  blogId: string;
  initialLikes?: string[];
  initialLiked?: boolean;
  initialCount?: number;
  variant?: "feed" | "detail" | "compact";
  className?: string;
  onLikedChange?: (newCount: number, isLiked: boolean) => void;
}

export default function LikeButton({
  blogId,
  initialLikes = [],
  initialLiked,
  initialCount,
  variant = "feed",
  className = "",
  onLikedChange,
}: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const isLikedInitial =
    initialLiked !== undefined
      ? initialLiked
      : Boolean(user?.id && initialLikes.some((id) => String(id) === String(user.id)));

  const countInitial =
    initialCount !== undefined ? initialCount : initialLikes.length;

  const [liked, setLiked] = useState<boolean>(isLikedInitial);
  const [likesCount, setLikesCount] = useState<number>(countInitial);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Please log in to like this blog.");
      router.push("/login");
      return;
    }

    if (isSubmitting) return;

    // Optimistic toggle
    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);
    onLikedChange?.(nextCount, nextLiked);
    setIsSubmitting(true);

    try {
      const response = await blogApi.toggleLike(blogId);
      const serverCount = response.result.likesCount;
      const serverLiked = response.result.liked;

      setLiked(serverLiked);
      setLikesCount(serverCount);
      onLikedChange?.(serverCount, serverLiked);
    } catch (error) {
      // Revert on error
      setLiked(prevLiked);
      setLikesCount(prevCount);
      onLikedChange?.(prevCount, prevLiked);
      toast.error("Failed to update like. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isSubmitting}
        aria-label={liked ? "Unlike blog" : "Like blog"}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          liked
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        } ${className}`}
      >
        {liked ? (
          <FaThumbsUp className="h-3.5 w-3.5" />
        ) : (
          <FaRegThumbsUp className="h-3.5 w-3.5" />
        )}
        <span>{likesCount}</span>
      </button>
    );
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isSubmitting}
        aria-label={liked ? "Unlike blog" : "Like blog"}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
          liked
            ? "border-primary/30 bg-primary/10 text-primary shadow-xs"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
        } ${className}`}
      >
        {liked ? (
          <FaThumbsUp className="h-4 w-4 text-primary" />
        ) : (
          <FaRegThumbsUp className="h-4 w-4 text-muted-foreground" />
        )}
        <span>{liked ? "Liked" : "Like"}</span>
        <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-xs font-bold text-foreground">
          {likesCount}
        </span>
      </button>
    );
  }

  // "feed" action bar button: Facebook-style equal-width button
  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isSubmitting}
      aria-label={liked ? "Unlike blog" : "Like blog"}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors hover:bg-muted/60 active:scale-[0.99] ${
        liked ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      {liked ? (
        <FaThumbsUp className="h-4 w-4 text-primary" />
      ) : (
        <FaRegThumbsUp className="h-4 w-4" />
      )}
      <span>Like</span>
    </button>
  );
}
