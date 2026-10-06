"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { blogApi, type Blog } from "../../../lib/blog";
import { categoryApi, type Category } from "../../../lib/category";
import BlogFilters from "../../../components/ui/blog-filters";
import SearchBox from "../../../components/ui/search-box";
import BlogFeedCard from "../../../components/BlogFeedCard";
import { toast } from "sonner";

function BlogCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5 flex-1">
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
        const res = await blogApi.list({ page: 1, limit, search, category, tag });
        if (requestIdRef.current !== currentRequestId) return;
        const fetched = res.result ?? [];
        setBlogs(fetched);
        setHasMore(1 < (res.meta?.totalPages ?? 1));
        setLoading(false);
      } catch {
        if (requestIdRef.current !== currentRequestId) return;
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
  }, [search, category, tag]);

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

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/blogs?${params.toString()}`);
    },
    [router, searchParams],
  );



  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-8xl px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-[780px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BlogFilters categories={categories} />
            <SearchBox
              initialValue={search}
              onSearch={handleSearch}
              placeholder="Search blogs "
            />
          
          </div>

          {loading && (
            <div className="mt-6 space-y-6">
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </div>
          )}

          {!loading && fetchError && (
            <div className="py-20 text-center">
              <h2 className="text-xl font-bold text-foreground">
                Unable to load blogs
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setFetchError(false);
                  blogApi
                    .list({ page: 1, limit, search, category, tag })
                    .then((res) => {
                      const fetched = res.result ?? [];
                      setBlogs(fetched);
                      setHasMore(1 < (res.meta?.totalPages ?? 1));
                    })
                    .catch(() => {
                      setFetchError(true);
                      toast.error("Unable to load blogs.");
                    })
                    .finally(() => setLoading(false));
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !fetchError && blogs.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                {search ? `No blogs matching "${search}".` : "No blogs found."}
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground mb-2">
                Could not load more articles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFetchMoreError(false);
                  void loadMore();
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
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
