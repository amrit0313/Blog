import { getBlogs, BlogsResponse } from "../../lib/blogs";
import BlogGrid from "../../../components/ui/bloggrid";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const limit = 9;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  let data: BlogsResponse;
  try {
    data = await getBlogs(currentPage, limit);
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Unable to load blogs</h1>
          <p className="mt-2 text-muted-foreground">
            Please make sure the API server is running on port 5000.
          </p>
        </div>
      </div>
    );
  }

  const { blogs, totalPages } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="eyebrow">Our Blog</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Latest Articles
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Discover stories, insights, and updates from our community of writers.
          </p>
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