import Link from "next/link";
import type { Blog } from "../lib/blog";

export interface ProfileBlogCardProps {
  blog: Blog;
  statusClassName?: string;
  badgeClassName?: string;
  statusBadgeClassName?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

const defaultStatusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  submitted: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700",
};

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function getDescriptionPreview(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProfileBlogCard({
  blog,
  statusClassName,
  badgeClassName,
  statusBadgeClassName,
  actionHref,
  actionLabel = "Read blog",
  className = "",
}: ProfileBlogCardProps) {
  const badgeStyle =
    statusClassName ??
    badgeClassName ??
    statusBadgeClassName ??
    (blog.status ? defaultStatusStyles[blog.status] : undefined) ??
    "bg-gray-100 text-gray-700";

  const href = actionHref ?? `/blogs/${blog.slug}`;

  return (
    <article className={`card flex flex-col p-6 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-lg leading-tight">{blog.title}</h4>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}
        >
          {blog.status}
        </span>
      </div>
      {blog.category?.title && (
        <p className="mt-2 text-sm text-primary">{blog.category.title}</p>
      )}
      {blog.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-6">
          {getDescriptionPreview(blog.description)}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-4 pt-4 text-sm">
        <span className="text-muted-foreground">
          {formatDate(blog.updatedAt ?? blog.createdAt) ?? "Recently"}
        </span>
        <Link
          href={href}
          className="font-semibold no-underline hover:underline"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
