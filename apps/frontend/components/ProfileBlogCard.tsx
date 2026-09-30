"use client";

import type { Blog } from "../lib/blog";
import BlogFeedCard from "./BlogFeedCard";

export interface ProfileBlogCardProps {
  blog: Blog;
  statusClassName?: string;
  badgeClassName?: string;
  statusBadgeClassName?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  onDelete?: (blogId: string) => void;
  onUnpublish?: (blogId: string) => void;
}

export default function ProfileBlogCard({
  blog,
  onDelete,
  onUnpublish,
}: ProfileBlogCardProps) {
  return (
    <BlogFeedCard
      blog={blog}
      isProfile={true}
      onDelete={onDelete}
      onUnpublish={onUnpublish}
    />
  );
}
