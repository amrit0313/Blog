"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { blogApi, type Blog } from "../../../../lib/blog";
import { ApiError } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/dashboard/badge";
import Modal from "../../../../components/dashboard/modal";
import Link from "next/link";
import DOMPurify from "dompurify";
import LikeButton from "../../../../components/LikeButton";
import CommentSection from "../../../../components/CommentSection";
import { imgSrc } from "../../../../utils/getImgSrc";
import SaveBlogButton from "../../../../components/SaveBlogButton";

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function readingTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function cleanEmptyNodes(html: string) {
  return html
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<li>\s*<\/li>/g, "")
    .replace(/<li><p>\s*<\/p><\/li>/g, "");
}

function getBlogImageUrl(image?: string | { key?: string; url?: string }) {
  if (!image) return null;
  return imgSrc(image, "blogs") ?? null;
}

/** True only when the post was meaningfully edited after publishing (> 1 min). */
function wasEdited(createdAt?: string, updatedAt?: string) {
  if (!createdAt || !updatedAt) return false;
  const diff = new Date(updatedAt).getTime() - new Date(createdAt).getTime();
  return Number.isFinite(diff) && diff > 60_000;
}

/* ─── Icons ───────────────────────────────────────────────────── */

const ICON_PROPS = {
  className: "h-4 w-4",
  fill: "none",
  stroke: "currentColor",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

function ArrowLeftIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse px-5 pb-12 pt-6">
      <div className="mb-4 h-4 w-20 rounded bg-muted" />
      <div className="mb-3 h-5 w-24 rounded-full bg-muted" />
      <div className="mb-3 h-8 w-4/5 rounded bg-muted" />
      <div className="mb-6 h-4 w-64 rounded bg-muted" />
      <div className="mb-8 aspect-video max-h-[360px] w-full rounded-xl bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-11/12 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────── */

function Avatar({ name, size = "sm" }: { name?: string; size?: "sm" | "md" }) {
  const initial = name?.charAt(0).toUpperCase() ?? "?";
  const sizing = size === "md" ? "h-10 w-10 text-sm" : "h-6 w-6 text-xs";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground ${sizing}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

/* ─── Cover image (renders nothing if missing or broken) ──────── */

function HeroImage({ blog }: { blog: Blog }) {
  const [imgError, setImgError] = useState(false);
  const url = getBlogImageUrl(blog.image);

  if (!url || imgError) return null;

  const isSvg = url.split("?")[0].toLowerCase().endsWith(".svg");

  return (
    <div
      className={`mt-6 w-full overflow-hidden rounded-xl border border-border ${
        isSvg ? "bg-muted/50" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={blog.title}
        onError={() => setImgError(true)}
        className={`w-full max-h-[360px] ${
          isSvg ? "mx-auto object-contain p-6" : "aspect-video object-cover"
        }`}
      />
    </div>
  );
}

/* ─── About the author ────────────────────────────────────────── */

function AboutAuthor({ blog }: { blog: Blog }) {
  const name = blog.author?.name ?? "Unknown";
  const hasProfile = Boolean(blog.author?._id);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">Author</p>
        </div>
      </div>
      {hasProfile && (
        <Link
          href={`/authors/${blog.author?._id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all posts by {name}
        </Link>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

const ACTION_BTN =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]";

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchBlog = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      setError("");
      setNotFound(false);
      const res = await blogApi.getBySlug(slug);
      setBlog(res.result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setError("We can't find that article.");
      } else {
        setError(
          "Couldn't load this article. Check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const isAuthor = Boolean(user && blog && user.id === blog.author?._id);

  const sanitizedHtml = useMemo(() => {
    if (!blog?.description) return "";
    return DOMPurify.sanitize(cleanEmptyNodes(blog.description));
  }, [blog?.description]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }, []);

  const handleDelete = async () => {
    if (!blog) return;
    setDeleteLoading(true);
    try {
      await blogApi.delete(blog._id);
      router.push("/blogs");
    } catch {
      setError("Couldn't delete this blog. Try again.");
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading || authLoading) return <DetailSkeleton />;

  /* Error / not found */
  if (error && !blog) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-foreground">{error}</h1>
          {notFound && (
            <p className="mt-2 text-sm text-muted-foreground">
              It may have been moved or removed.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            {!notFound && <Button onClick={fetchBlog}>Retry</Button>}
            <Link href="/blogs">
              <Button variant="outline">Browse all blogs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const created = formatDate(blog.createdAt);
  const edited = wasEdited(blog.createdAt, blog.updatedAt)
    ? formatDate(blog.updatedAt)
    : null;
  const isDraft = blog.status !== "published";
  const hasTags = Boolean(blog.tags && blog.tags.length > 0);

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6">
        {/* ── Header ── */}
        <header>
          <Link
            href="/blogs"
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">
              <ArrowLeftIcon />
            </span>
            All blogs
          </Link>

          {(blog.category?.title || hasTags) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {blog.category?.title && (
                <Badge variant="info" className="!text-xs">
                  {blog.category.title}
                </Badge>
              )}
              {blog.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {blog.title}
            {isDraft && isAuthor && (
              <Badge variant="warning" className="ml-3 align-middle !text-xs">
                Draft
              </Badge>
            )}
          </h1>

          {/* One byline: author · date · reading time */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Avatar name={blog.author?.name} />
            {blog.author?._id ? (
              <Link
                href={`/authors/${blog.author._id}`}
                className="font-medium text-foreground hover:underline"
              >
                {blog.author?.name ?? "Unknown"}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {blog.author?.name ?? "Unknown"}
              </span>
            )}
            {created && (
              <>
                <span aria-hidden>·</span>
                <span>{created}</span>
              </>
            )}
            {edited && (
              <>
                <span aria-hidden>·</span>
                <span>Updated {edited}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{readingTime(blog.description)}</span>
          </div>

          {isAuthor && (
            <div className="mt-4 flex gap-2">
              <Link href={`/blogs/${blog.slug}/edit`}>
                <Button variant="outline">
                  <EditIcon />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                className="!text-red-600 hover:!border-red-300 hover:!text-red-700"
                onClick={() => setDeleteModalOpen(true)}
              >
                <TrashIcon />
                Delete
              </Button>
            </div>
          )}
        </header>

        {/* ── Cover ── */}
        <HeroImage blog={blog} />

        {/* ── Body ── */}
        <div className="mt-8">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div
            className="blog-prose text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>

        {/* ── Action bar (sticky on mobile) ── */}
        <div className="sticky bottom-0 z-10 -mx-5 mt-10 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <div className="flex flex-wrap items-center gap-2">
            <LikeButton
              blogId={blog._id}
              initialLikes={blog.likes}
              variant="detail"
            />
            {blog.status === "published" && (
              <SaveBlogButton
                blogId={blog._id}
                className="flex-none border border-border bg-white px-4 hover:border-primary hover:text-primary"
              />
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className={ACTION_BTN}
            >
              {copied ? <CheckIcon /> : <LinkIcon />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        {/* ── About the author ── */}
        <section className="mt-8" aria-label="About the author">
          <AboutAuthor blog={blog} />
        </section>

        {/* ── Discussion ── */}
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Discussion</h2>
          <CommentSection blogId={blog._id} alwaysOpen={true} isOpen={true} />
        </section>

        {/* ── CTA ── */}
        <section className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-5 py-4">
          <p className="text-sm font-medium text-foreground">Enjoyed this?</p>
          <Link href="/blogs">
            <Button>Browse more articles</Button>
          </Link>
        </section>
      </article>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete this blog?"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteLoading ? "Deleting…" : "Delete blog"}
            </button>
          </>
        }
      >
        <p className="text-muted-foreground">
          &ldquo;{blog.title}&rdquo; will be permanently removed. This
          can&apos;t be undone.
        </p>
      </Modal>

      <style jsx global>{`
        .blog-prose {
          font-size: 1.0625rem;
          line-height: 1.75;
          max-width: 68ch;
        }
        .blog-prose > * + * {
          margin-top: 1.1em;
        }
        .blog-prose p {
          color: var(--foreground);
        }
        .blog-prose p:empty,
        .blog-prose li:empty,
        .blog-prose li > p:empty {
          display: none;
        }
        .blog-prose strong {
          font-weight: 700;
          color: var(--foreground);
        }
        .blog-prose em {
          font-style: italic;
        }
        /* The page title is the only H1, so editor H1s share the H2 style. */
        .blog-prose h1,
        .blog-prose h2 {
          font-size: 1.375rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.75em;
          margin-bottom: 0.5em;
        }
        .blog-prose h3 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.35;
          margin-top: 1.5em;
          margin-bottom: 0.4em;
        }
        .blog-prose blockquote {
          border-left: 3px solid var(--primary);
          background: color-mix(in srgb, var(--primary) 5%, transparent);
          border-radius: 0 var(--radius) var(--radius) 0;
          padding: 0.75rem 1rem;
          margin: 1.5em 0;
          font-style: italic;
          color: var(--muted-foreground);
        }
        .blog-prose blockquote p {
          color: var(--muted-foreground);
          margin: 0;
        }
        .blog-prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .blog-prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .blog-prose li {
          padding-left: 0.25rem;
          margin-top: 0.3em;
        }
        .blog-prose li > ol,
        .blog-prose li > ul {
          margin-top: 0.3em;
        }
        .blog-prose a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-prose a:hover {
          color: #b92535;
        }
        .blog-prose code {
          background: var(--muted);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: var(--font-geist-mono), monospace;
        }
        .blog-prose pre {
          background: var(--foreground);
          color: var(--background);
          padding: 1rem;
          border-radius: var(--radius);
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .blog-prose pre code {
          background: none;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
          color: inherit;
        }
        .blog-prose img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
          margin: 1.25em 0;
        }
        .blog-prose hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 2em 0;
        }
      `}</style>
    </>
  );
}
