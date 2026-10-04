"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../../../../components/ui/Button";
import { useAuth } from "../../../../../context/AuthContext";
import { ApiError } from "../../../../../lib/api";
import { blogApi, type Blog } from "../../../../../lib/blog";
import { imgSrc } from "../../../../../utils/getImgSrc";



export default function DraftDetailPage() {
  const router = useRouter();
  const{slug} = useParams<{slug: string}>()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [draft, setDraft] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    blogApi
      .getDraftBySlug(slug)
      .then((response) => {
        if (cancelled) return;
        if (response.result.status !== "draft") {
          setError("This blog is no longer a draft.");
          return;
        }
        setDraft(response.result);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load this draft.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, isAuthLoading, isAuthenticated, router]);

  async function handleDelete() {
    if (!draft || !window.confirm("Delete this draft?")) return;
    setDeleting(true);
    try {
      await blogApi.delete(draft._id);
      router.replace("/profile/drafts");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete this draft.",
      );
      setDeleting(false);
    }
  }

  if (isAuthLoading || (!isAuthenticated && !error)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        Loading draft...
      </main>
    );
  }
  if (!isAuthenticated) return null;
  if (loading)
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        Loading draft...
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
      <Link
        href="/profile/drafts"
        className="text-sm font-semibold no-underline hover:underline"
      >
        &larr; Back to drafts
      </Link>
      {error || !draft ? (
        <div className="mt-8 card p-8 text-center">
          <h1 className="text-2xl">Draft unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            {error || "This draft could not be found."}
          </p>
          <Button href="/profile/drafts" variant="outline" className="mt-6">
            Return to drafts
          </Button>
        </div>
      ) : (
        <article className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
              Draft
            </span>
            <span className="text-sm text-muted-foreground">
              Private and unpublished
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground sm:text-4xl">
            {draft.title || "Untitled draft"}
          </h1>
          {draft.category?.title && (
            <p className="mt-3 text-primary">{draft.category.title}</p>
          )}
          {draft.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc(draft.image, "blogs")}
              alt=""
              className="mt-8 aspect-video w-full rounded-md object-cover"
            />
          )}
          <p className="mt-8 whitespace-pre-wrap leading-8 text-foreground">
            {draft.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
            <Button href={`/profile/drafts/${draft.slug}/edit`}>
              Continue Editing
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Draft"}
            </Button>
          </div>
        </article>
      )}
    </main>
  );
}
