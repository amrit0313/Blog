"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "./avatar";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import type { Blog } from "../lib/blog";
import { imgSrc } from "../utils/getImgSrc";
import { toast } from "sonner";
import { FaShare, FaRegComment, FaThumbsUp } from "react-icons/fa6";
import {
  HiOutlineEllipsisVertical,
  HiPencilSquare,
  HiTrash,
  HiEyeSlash,
} from "react-icons/hi2";
import Highlight from "../utils/highlighter";

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

const getDescriptionPreview = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const statusBadgeStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  submitted: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  unpublished: "bg-gray-100 text-gray-700",
  draft: "bg-amber-100 text-amber-700",
};

interface BlogFeedCardProps {
  blog: Blog;
  isProfile?: boolean;
  onDelete?: (blogId: string) => void;
  onUnpublish?: (blogId: string) => void;
  search?: string;
}

export default function BlogFeedCard({
  blog,
  isProfile = false,
  onDelete,
  onUnpublish,
  search,
}: BlogFeedCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(blog.likes?.length ?? 0);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const authorName = blog.author?.name ?? "Unknown Author";
  const detailHref = `/blogs/${blog.slug}`;
  const excerpt = blog.description
    ? getDescriptionPreview(blog.description)
    : "";
  const imageUrl = blog.image ? imgSrc(blog.image, "blogs") : null;

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${detailHref}`
        : detailHref;
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Blog link copied to clipboard!");
      }
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <article className="rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-sm overflow-hidden">
      {/* a. Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={authorName}
            className="h-10 w-10 text-sm shrink-0"
            fallback="initials"
          />
          <div className="leading-tight">
            <Link
              href={`/authors/${blog.author?._id}`}
              className="font-semibold text-sm text-foreground block hover:underline"
            >
              <Highlight text={authorName} query={search} />
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatRelative(blog.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {blog.category?.title && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              <Highlight text={blog.title} query={search} />
            </span>
          )}

          {isProfile && blog.status && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusBadgeStyles[blog.status] ??
                "bg-muted text-muted-foreground"
              }`}
            >
              {blog.status}
            </span>
          )}

          {isProfile && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Blog actions menu"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <HiOutlineEllipsisVertical className="h-5 w-5" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border bg-card py-1 shadow-md"
                  onClick={() => setMenuOpen(false)}
                >
                  <Link
                    href={`/blogs/${blog.slug}/edit`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <HiPencilSquare className="h-4 w-4" /> Edit
                  </Link>

                  {blog.status === "published" && onUnpublish && (
                    <button
                      type="button"
                      onClick={() => onUnpublish(blog._id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-muted"
                    >
                      <HiEyeSlash className="h-4 w-4" /> Unpublish
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(blog._id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-muted"
                    >
                      <HiTrash className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <Link href={detailHref} className="group block">
          <h2 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
            <Highlight text={blog.title} query={search} />
          </h2>
        </Link>

        {excerpt && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            <Highlight text={excerpt} query={search} />{" "}
            <Link
              href={detailHref}
              className="font-medium text-primary hover:underline ml-1"
            >
              Read more
            </Link>
          </p>
        )}

        {imageUrl && (
          <Link
            href={detailHref}
            className="mt-3 block overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={blog.title}
              className="aspect-video max-h-[380px] w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
            />
          </Link>
        )}
      </div>

      {/* c. Stats row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
            <FaThumbsUp />
          </span>
          <span>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </span>
        </span>

        <button
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          className="hover:underline"
        >
          {commentCount !== null
            ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`
            : "Comments"}
        </button>
      </div>

      {/* d. Divider & Action bar */}
      <div className="border-t border-border px-2 py-1">
        <div className="flex items-center justify-around gap-1">
          <LikeButton
            blogId={blog._id}
            initialLikes={blog.likes}
            onLikedChange={(newCount) => setLikesCount(newCount)}
          />

          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            aria-label="Toggle comments"
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors hover:bg-muted/60 active:scale-[0.99] ${
              commentsOpen
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FaRegComment className="h-4 w-4" />
            <span>Comment</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share blog"
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:scale-[0.99]"
          >
            <FaShare className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* e. Expandable comments section */}
      {commentsOpen && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4">
          <CommentSection
            blogId={blog._id}
            isOpen={commentsOpen}
            onCommentCountChange={(count) => setCommentCount(count)}
          />
        </div>
      )}
    </article>
  );
}
