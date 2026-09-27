import { getBlogs, BlogsResponse } from "../../../lib/blogs";
import BlogGrid from "../../../../components/ui/bloggrid";

export default async function DashboardBlogsPage({
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
      <div className="py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">Unable to load blogs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please make sure the API server is running on port 5000.
        </p>
      </div>
    );
  }

  const { blogs, totalPages } = data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">All Blogs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse everything published on the platform.
        </p>
      </div>

      <BlogGrid
        blogs={blogs}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/dashboard/blogs"
      />
    </div>
  );
}