import { blogApi, type Blog } from "../../../lib/blog";
import BlogGrid from "../../../components/ui/bloggrid";
import { ApiError } from "../../../lib/api";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const limit = 9;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  let blogs: Blog[];
  let totalPages: number;

  try {
    const response = await blogApi.list({ page: currentPage, limit });
    blogs = response.result;
    totalPages = response.meta.totalPages;
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
          <h1 className="text-2xl font-bold text-foreground">Unable to load blogs</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 lg:py-8">
         
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-center text-primary sm:text-5xl">
            Latest Articles
          </h1>
          <p className="mt-4  text-center  sm:text-lg">
            Discover stories, insights, and updates from our community of writers.
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
              <span className="text-lg font-bold text-foreground">{blogs.length}</span>
              <span>on this page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <BlogGrid
          blogs={blogs}
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/blogs"
        />
      </div>
    </div>
  );
}