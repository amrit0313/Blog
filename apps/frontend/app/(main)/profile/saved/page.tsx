"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../../../../components/ui/Button";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { profileApi } from "../../../../lib/profile";
import type { Blog } from "../../../../lib/blog";
import { toast } from "sonner";
import { imgSrc } from "../../../../utils/getImgSrc";

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
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

export default function SavedBlogsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [savedBlogs, setSavedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingBlogId, setRemovingBlogId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    profileApi
      .get()
      .then((response) => {
        if (!cancelled) setSavedBlogs(response.profile?.savedBlogs ?? []);
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (requestError instanceof ApiError && requestError.status === 400) {
          setSavedBlogs([]);
        } else {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load your saved blogs.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, router]);

  const removeSavedBlog = async (blogId: string) => {
    setRemovingBlogId(blogId);
    try {
      await profileApi.removeSavedBlog(blogId);
      setSavedBlogs((current) =>
        current.filter((savedBlog) => savedBlog._id !== blogId),
      );
      toast.success("Blog removed from saved blogs");
    } catch {
      toast.error("Failed to remove saved blog. Please try again.");
    } finally {
      setRemovingBlogId(null);
    }
  };

  if (isAuthLoading || (!isAuthenticated && !error)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        Loading your saved blogs...
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
      <Link
        href="/profile"
        className="text-sm font-semibold no-underline hover:underline"
      >
        &larr; Back to profile
      </Link>
      <div className="mt-8">
        <p className="eyebrow">Your reading list</p>
        <h1 className="mt-2 text-3xl">Saved Blogs</h1>
        <p className="mt-2 text-muted-foreground">
          Published blogs you saved to read later.
        </p>
      </div>

      {loading && <p className="mt-8">Loading your saved blogs...</p>}
      {error && (
        <p
          role="alert"
          className="mt-8 rounded-md border border-primary/30 bg-secondary px-4 py-3 text-secondary-foreground"
        >
          {error}
        </p>
      )}
      {!loading && !error && savedBlogs.length === 0 && (
        <div className="card mt-8 p-8 text-center sm:p-12">
          <h2 className="text-2xl">No saved blogs yet</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">
            Save a blog while browsing and it will be waiting here for you.
          </p>
          <Button href="/blogs" className="mt-6">
            Browse blogs
          </Button>
        </div>
      )}
      {!loading && !error && savedBlogs.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {savedBlogs.map((savedBlog) => {
            const imageUrl = savedBlog.image
              ? imgSrc(savedBlog.image, "blogs")
              : null;

            return (
              <article
                key={savedBlog._id}
                className="card flex flex-col overflow-hidden"
              >
                {imageUrl && (
                  <Link href={`/blogs/${savedBlog.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  </Link>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/blogs/${savedBlog.slug}`}
                      className="text-xl font-semibold leading-tight text-foreground no-underline hover:text-primary"
                    >
                      {savedBlog.title}
                    </Link>
                    {savedBlog.category?.title && (
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {savedBlog.category.title}
                      </span>
                    )}
                  </div>
                  {savedBlog.description && (
                    <p className="mt-3 line-clamp-3 leading-6 text-muted-foreground">
                      {getDescriptionPreview(savedBlog.description)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
                    <span className="text-muted-foreground">
                      By {savedBlog.author?.name ?? "Unknown"} ·{" "}
                      {formatDate(savedBlog.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeSavedBlog(savedBlog._id)}
                      disabled={removingBlogId === savedBlog._id}
                      className="shrink-0 rounded-md bg-red-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingBlogId === savedBlog._id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
