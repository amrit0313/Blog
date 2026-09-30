"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../../../components/ui/Button";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { blogApi, type Blog } from "../../../../lib/blog";
import * as yup from "yup";
import { imgSrc } from "../../../../utils/getImgSrc";

function formatDate(value: string) {
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

export default function DraftsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    blogApi
      .myBlogs()
      .then((response) => {
        if (!cancelled) {
          // No schema validation needed here for GET requests
          const drafts = (response.result ?? []).filter(
            (blog) => blog.status === "draft",
          );
          setDrafts(drafts);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load your drafts.",
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

  if (isAuthLoading || (!isAuthenticated && !error)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        Loading your drafts...
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
      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Private writing</p>
          <h1 className="mt-2 text-3xl">Drafts</h1>
          <p className="mt-2 text-muted-foreground">
            Unpublished blogs visible only to you.
          </p>
        </div>
        <Button href="/blogs/create" variant="outline">
          Start a new blog
        </Button>
      </div>

      {loading && <p className="mt-8">Loading your drafts...</p>}
      {error && (
        <p
          role="alert"
          className="mt-8 rounded-md border border-primary/30 bg-secondary px-4 py-3 text-secondary-foreground"
        >
          {error}
        </p>
      )}
      {!loading && !error && drafts.length === 0 && (
        <div className="card mt-8 p-8 text-center sm:p-12">
          <h2 className="text-2xl">No drafts yet</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">
            Your unfinished blogs will appear here.
          </p>
          <Button href="/blogs/create" className="mt-6">
            Create a blog
          </Button>
        </div>
      )}
      {!loading && !error && drafts.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <article
              key={draft._id}
              className="card flex flex-col overflow-hidden"
            >
              {draft.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc(draft.image, "blogs")}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl leading-tight">
                    {draft.title || "Untitled draft"}
                  </h2>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    Draft
                  </span>
                </div>
                {draft.description && (
                  <p className="mt-3 line-clamp-3 leading-6 text-muted-foreground">
                    {getDescriptionPreview(draft.description)}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
                  <span className="text-muted-foreground">
                    Edited {formatDate(draft.updatedAt)}
                  </span>
                  <Link
                    href={`/profile/drafts/${draft._id}`}
                    className="font-semibold text-primary no-underline hover:underline"
                  >
                    Continue
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
