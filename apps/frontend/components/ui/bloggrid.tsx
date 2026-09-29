// components/blogs/blog-grid.tsx
import Link from "next/link";
import Card from "../dashboard/card";
import { HiCalendar, HiUser, HiTag, HiArrowRight } from "react-icons/hi2";
import type { Blog } from "../../lib/blog";

interface BlogGridProps {
  blogs: Blog[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  search?: string;
  category?: string;
}

const getDescriptionPreview = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function BlogGrid({
  blogs,
  currentPage,
  totalPages,
  basePath,
  search,
  category,
  author
}: BlogGridProps) {
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  if (blogs.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">No blogs found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {blogs.map((blog) => (
          <Link key={blog._id} href={`/blogs/${blog._id}`}>
            <Card
              variant="bordered"
              padding="none"
              className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {blog.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/blogs/${blog.image}`}
                    alt={blog.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <p className="text-3xl font-bold text-secondary-foreground/30">
                      {blog.title.charAt(0).toUpperCase()}
                    </p>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${blog.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {blog.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HiTag className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {blog.category?.title ?? "Uncategorized"}
                  </span>
                </div>
                <h2 className="mt-2 line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
                  {blog.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {getDescriptionPreview(blog.description)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <HiUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs text-muted-foreground">
                      {blog.author?.name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <HiCalendar className="h-3.5 w-3.5" />
                    <time dateTime={blog.createdAt}>
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={pageHref(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={pageHref(page)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
            >
              {page}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={pageHref(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Next
              <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </>
  );
}
