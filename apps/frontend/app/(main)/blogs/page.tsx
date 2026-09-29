import Link from "next/link";
import { blogApi, type Blog } from "../../../lib/blog";
import BlogGrid from "../../../components/ui/bloggrid";
import BlogFilters from "../../../components/ui/blog-filters";
import { categoryApi, type Category } from "../../../lib/category";
import { ApiError } from "../../../lib/api";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}) {
  const { page: pageParam, search, category } = await searchParams;
  const limit = 7;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  let blogs: Blog[];
  let totalPages: number;
  let categories: Category[];

  try {
    const [response, categoryResponse] = await Promise.all([
      blogApi.list({ page: currentPage, limit, search, category }),
      categoryApi.list(),
    ]);
    blogs = response.result;
    totalPages = response.meta.totalPages;
    categories = categoryResponse.result ?? [];
  } catch (error) {
    console.error("Failed to load blogs:", error);

    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Something went wrong while loading blogs.";

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load blogs
          </h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 lg:py-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back
            </Link>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-center text-primary sm:text-5xl">
            Latest Articles
          </h1>
          <p className="mt-4  text-center  sm:text-lg">
            Discover stories, insights, and updates from our community of
            writers.
          </p>

          <div className="mt-8 flex items-center gap-6 text-sm text-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {totalPages > 0 ? `${totalPages}+` : "0"}
              </span>
              <span>pages</span>
            </div>
            <span className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {blogs.length}
              </span>
              <span>on this page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <BlogFilters categories={categories} />
        <BlogGrid
          blogs={blogs}
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/blogs"
          search={search}
          category={category}
        />
      </div>
    </div>
  );
}
