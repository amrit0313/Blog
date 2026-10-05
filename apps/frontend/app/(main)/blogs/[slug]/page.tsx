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

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function formatRelative(value?: string) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
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

/* ─── Skeleton ────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-6 py-12 lg:px-8">
      <div className="mb-6 h-4 w-28 rounded bg-muted" />
      <div className="mb-3 h-5 w-20 rounded-full bg-muted" />
      <div className="mb-2 h-10 w-3/4 rounded bg-muted" />
      <div className="mb-8 flex gap-4">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[320px] rounded-2xl bg-muted lg:col-span-8" />
        <div className="space-y-4 lg:col-span-4">
          <div className="h-28 rounded-xl bg-muted" />
          <div className="h-44 rounded-xl bg-muted" />
        </div>
      </div>
      <div className="w-full space-y-4">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}

/* ─── Sidebar Author Card ─────────────────────────────────────── */

function AuthorCard({ blog }: { blog: Blog }) {
  const initial = blog.author?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="card overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-accent" />
      <div className="p-5">
        <p className="eyebrow mb-3">Written by</p>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
            {initial}
          </span>
          <div>
            <Link
              href={`/authors/${blog.author?._id}`}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {blog.author?.name ?? "Unknown"}
            </Link>
            {blog.author?.email && (
              <p className="text-xs text-muted-foreground">
                {blog.author.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Meta Card ───────────────────────────────────────── */

function MetaCard({
  blog,
  onCopyLink,
  copied,
}: {
  blog: Blog;
  onCopyLink: () => void;
  copied: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="space-y-4 text-sm">
        {blog.category?.title && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Category</span>
            <Badge variant="info">{blog.category.title}</Badge>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge
            variant={
              blog.status === "published"
                ? "success"
                : blog.status === "draft"
                  ? "warning"
                  : "default"
            }
          >
            {blog.status}
          </Badge>
        </div>
        {formatDate(blog.createdAt) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Published</span>
            <span className="font-medium text-foreground">
              {formatDate(blog.createdAt)}
            </span>
          </div>
        )}
        {formatDate(blog.updatedAt) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium text-foreground">
              {formatRelative(blog.updatedAt)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reading time</span>
          <span className="font-medium text-foreground">
            {readingTime(blog.description)}
          </span>
        </div>
        <div className="border-t border-border" />
        <button
          onClick={onCopyLink}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          {copied ? (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Hero Image ──────────────────────────────────────────────── */

function HeroImage({ blog }: { blog: Blog }) {
  const [imgError, setImgError] = useState(false);
  const url = getBlogImageUrl(blog.image);
  const isSvg =
    typeof url === "string" && url.split("?")[0].toLowerCase().endsWith(".svg");

  if (!url || imgError) {
    return (
      <div className="flex h-full min-h-[260px] max-h-[380px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary aspect-video">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-muted-foreground/50">
            No cover image
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-border ${
        isSvg ? "bg-muted/50" : ""
      }`}
      style={{ maxHeight: 380 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={blog.title}
        onError={() => setImgError(true)}
        className={`w-full ${
          isSvg
            ? "mx-auto max-h-[380px] object-contain p-8"
            : "aspect-video max-h-[380px] object-cover"
        }`}
      />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      try {
        setError("");
        const res = await blogApi.getBySlug(slug);
        setBlog(res.result);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError("Blog not found.");
        } else {
          setError("Unable to load this blog. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const isAuthor = user && blog && user.id === blog.author?._id;

  const sanitizedHtml = useMemo(() => {
    if (!blog?.description) return "";
    const cleaned = cleanEmptyNodes(blog.description);
    return DOMPurify.sanitize(cleaned);
  }, [blog?.description]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleDelete = async () => {
    if (!blog) return;
    setDeleteLoading(true);
    try {
      await blogApi.delete(blog._id);
      router.push("/blogs");
    } catch {
      setError("Failed to delete blog. Please try again.");
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading || authLoading) return <DetailSkeleton />;

  // if (!user) {
  //   return (
  //     <div className="flex min-h-[60vh] items-center justify-center px-6">
  //       <div className="max-w-md text-center">
  //         <h1 className="text-2xl font-bold text-foreground">
  //           Sign in to read this story
  //         </h1>
  //         <p className="mt-3 text-muted-foreground">
  //           Log in to access the full blog details and join the conversation.
  //         </p>
  //         <Link href="/login" className="mt-6 inline-block">
  //           <Button>Log in to continue</Button>
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  if (error && !blog) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <p className="mt-2 text-muted-foreground">
            The blog you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/blogs" className="mt-6 inline-block">
            <Button variant="outline">Back to Blogs</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-8">
        <header className="mb-8">
          <Link
            href="/blogs"
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blogs
          </Link>

          {blog.category?.title && (
            <div className="mt-5">
              <Badge variant="info" className="!text-xs">
                {blog.category.title}
              </Badge>
            </div>
          )}

          <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {blog.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {blog.author?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <Link
                href={`/authors/${blog.author?._id}`}
                className="font-medium text-foreground hover:underline"
              >
                {blog.author?.name ?? "Unknown"}
              </Link>
            </span>

            <span className="text-border">·</span>

            {formatDate(blog.createdAt) && (
              <>
                <span>{formatDate(blog.createdAt)}</span>
                <span className="text-border">·</span>
              </>
            )}

            <span>{readingTime(blog.description)}</span>
          </div>

          {isAuthor && (
            <div className="mt-5 flex gap-3">
              <Link href={`/blogs/${blog.slug}/edit`}>
                <Button variant="outline">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                className="!text-red-600 hover:!border-red-300 hover:!text-red-700"
                onClick={() => setDeleteModalOpen(true)}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </Button>
            </div>
          )}
             {blog.tags && blog.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className="mb-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <HeroImage blog={blog} />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <AuthorCard blog={blog} />
            <MetaCard blog={blog} onCopyLink={handleCopyLink} copied={copied} />
          </div>
        </div>

        <div className="w-full">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div
            className="blog-prose text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

          <footer className="mt-12 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                Last updated: {formatDate(blog.updatedAt) ?? "Unknown"}
              </span>
              <Link href="/blogs">
                <Button variant="outline">More Blogs</Button>
              </Link>
            </div>
          </footer>

          <section className="mt-10 border-t border-border pt-8">
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div className="flex items-center gap-3">
                <LikeButton
                  blogId={blog._id}
                  initialLikes={blog.likes}
                  variant="detail"
                />
              </div>
              <div className="flex items-center gap-3">
                {blog.status === "published" && (
                  <SaveBlogButton
                    blogId={blog._id}
                    className="flex-none border border-border bg-white px-4 hover:border-primary hover:text-primary"
                  />
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
                >
                  {copied ? "Link Copied!" : "Share Story"}
                </button>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Comments
              </h3>
              <CommentSection
                blogId={blog._id}
                alwaysOpen={true}
                isOpen={true}
              />
            </div>
          </section>
        </div>
      </article>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Blog"
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
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Are you sure you want to delete &quot;{blog?.title}&quot;? This action
          cannot be undone.
        </p>
      </Modal>

      <style jsx global>{`
        .blog-prose {
          font-size: 1.125rem;
          line-height: 1.8;
        }
        .blog-prose > * + * {
          margin-top: 1.25em;
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
        .blog-prose h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 2em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }
        .blog-prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.75em;
          margin-bottom: 0.5em;
          line-height: 1.35;
        }
        .blog-prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .blog-prose blockquote {
          border-left: 4px solid var(--primary);
          background: color-mix(in srgb, var(--primary) 5%, transparent);
          border-radius: 0 var(--radius) var(--radius) 0;
          padding: 1rem 1.25rem;
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
          padding-left: 1.75rem;
        }
        .blog-prose ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
        }
        .blog-prose li {
          padding-left: 0.375rem;
          margin-top: 0.375em;
        }
        .blog-prose li > ol,
        .blog-prose li > ul {
          margin-top: 0.375em;
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
          padding: 1.25rem;
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
          margin: 1.5em 0;
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
