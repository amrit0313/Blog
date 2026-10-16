"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  HiMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiXMark,
} from "react-icons/hi2";

import { blogApi, type Blog } from "../../../lib/blog";
import { categoryApi, type Category } from "../../../lib/category";
import BlogFilters from "../../../components/ui/blog-filters";
import BlogFeedCard from "../../../components/BlogFeedCard";


function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string;
  onSelect: (title: string) => void;
}) {
  const items = [{ _id: "", title: "All" }, ...categories];

  return (
    <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isSelected = item._id ? selected === item.title : !selected;

        return (
          <button
            key={item._id || "all"}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(item._id ? item.title : "")}
            className={`h-8 shrink-0 rounded-full border px-3 text-xs transition-colors ${
              isSelected
                ? "border-primary bg-primary font-semibold text-primary-foreground"
                : "border-border bg-card font-medium text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
}


function BlogCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
      <div className="h-48 w-full rounded-lg bg-muted" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {action}
        </button>
      )}
    </div>
  );
}


function BlogsFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const limit = 7;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [fetchMoreError, setFetchMoreError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    categoryApi
      .list()
      .then((res) => {
        if (!cancelled) setCategories(res.result ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const currentRequestId = ++requestIdRef.current;
    isFetchingRef.current = true;

    async function loadBlogs() {
      await Promise.resolve();
      if (cancelled || requestIdRef.current !== currentRequestId) return;

      setLoading(true);
      setFetchError(false);
      setFetchMoreError(false);
      setPage(1);

      try {
        const res = await blogApi.list({
          page: 1,
          limit,
          search,
          category,
          tag,
        });
        if (requestIdRef.current !== currentRequestId) return;
        const fetched = res.result ?? [];
        setBlogs(fetched);
        setHasMore(1 < (res.meta?.totalPages ?? 1));
        setLoading(false);
      } catch {
        if (requestIdRef.current !== currentRequestId) return;
        setBlogs([]);
        setHasMore(false);
        setLoading(false);
        setFetchError(true);
        toast.error("Unable to load blogs.");
      } finally {
        if (requestIdRef.current === currentRequestId) {
          isFetchingRef.current = false;
        }
      }
    }

    void loadBlogs();

    return () => {
      cancelled = true;
    };
  }, [search, category, tag, reloadKey]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    setFetchMoreError(false);

    const nextPage = page + 1;
    const currentRequestId = requestIdRef.current;

    try {
      const res = await blogApi.list({
        page: nextPage,
        limit,
        search,
        category,
        tag,
      });
      if (requestIdRef.current !== currentRequestId) return;

      const newItems = res.result ?? [];
      setBlogs((prev) => {
        const existingIds = new Set(prev.map((b) => b._id));
        const deduped = newItems.filter((b) => !existingIds.has(b._id));
        return [...prev, ...deduped];
      });

      setPage(nextPage);
      setHasMore(nextPage < (res.meta?.totalPages ?? 1));
    } catch {
      if (requestIdRef.current !== currentRequestId) return;
      setFetchMoreError(true);
      toast.error("Failed to load more blogs.");
    } finally {
      if (requestIdRef.current === currentRequestId) {
        isFetchingRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [loading, loadingMore, hasMore, page, search, category, tag, limit]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || fetchMoreError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, fetchMoreError, loadMore]);

  const updateFilters = useCallback(
    (next: { category?: string; tag?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.category !== undefined) {
        if (next.category) params.set("category", next.category);
        else params.delete("category");
      }
      if (next.tag !== undefined) {
        if (next.tag) params.set("tag", next.tag);
        else params.delete("tag");
      }

      const query = params.toString();
      router.push(query ? `/blogs?${query}` : "/blogs");
    },
    [router, searchParams],
  );

  const hasFilters = Boolean(search || category || tag);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-8xl px-6 py-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[780px]">
          {/* Header: search + category (dropdown on desktop, chips on mobile) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                aria-label="Search blogs and people"
                className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm transition-colors hover:border-primary"
              >
                <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span
                  className={`truncate ${
                    search ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {search || "Search blogs and people"}
                </span>
              </Link>

              <div className="hidden shrink-0 sm:block">
                <BlogFilters categories={categories} />
              </div>
            </div>

            <div className="sm:hidden">
              <CategoryChips
                categories={categories}
                selected={category}
                onSelect={(title) => updateFilters({ category: title })}
              />
            </div>

            {tag && (
              <button
                type="button"
                onClick={() => updateFilters({ tag: "" })}
                aria-label={`Remove tag filter ${tag}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                #{tag}
                <HiXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-6 space-y-6">
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </div>
          )}

          {!loading && fetchError && (
            <EmptyState
              icon={<HiOutlineExclamationCircle className="h-9 w-9" />}
              title="Unable to load blogs"
              message="Please check your connection and try again."
              action="Retry"
              onAction={() => setReloadKey((key) => key + 1)}
            />
          )}

          {!loading && !fetchError && blogs.length === 0 && (
            <EmptyState
              icon={<HiOutlineDocumentText className="h-9 w-9" />}
              title="No blogs found"
              message={
                search
                  ? `No blogs matching "${search}". Try another search.`
                  : "There are no stories to show for these filters yet."
              }
              action={hasFilters ? "Clear filters" : undefined}
              onAction={hasFilters ? () => router.push("/blogs") : undefined}
            />
          )}

          {!loading && blogs.length > 0 && (
            <div className="mt-6 space-y-6">
              {blogs.map((blog) => (
                <BlogFeedCard key={blog._id} blog={blog} search={search} />
              ))}
            </div>
          )}

          {loadingMore && (
            <div className="mt-6 space-y-6">
              <BlogCardSkeleton />
            </div>
          )}

          {fetchMoreError && (
            <div className="py-6 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Could not load more articles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFetchMoreError(false);
                  void loadMore();
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !hasMore && blogs.length > 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              You&apos;re all caught up
            </div>
          )}

          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background py-16">
          <div className="mx-auto max-w-[680px] space-y-6 px-4">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        </div>
      }
    >
      <BlogsFeed />
    </Suspense>
  );
}