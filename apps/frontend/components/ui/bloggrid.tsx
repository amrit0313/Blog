"use client";

import Link from "next/link";
import { HiArrowRight } from "react-icons/hi2";
import type { Blog } from "../../lib/blog";
import BlogFeedCard from "../BlogFeedCard";

interface BlogGridProps {
  blogs: Blog[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  search?: string;
  category?: string;
}

export default function BlogGrid({
  blogs,
  currentPage,
  totalPages,
  basePath,
  search,
  category,
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
    <div className="mx-auto max-w-[680px]">
      {/* Single centered column feed */}
      <div className="space-y-6">
        {blogs.map((blog) => (
          <BlogFeedCard key={blog._id} blog={blog} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
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
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                page === currentPage
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
    </div>
  );
}
