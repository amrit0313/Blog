// lib/get-blogs.ts
export interface BlogsResponse {
  success: boolean;
  blogs: any[];
  totalBlogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export async function getBlogs(
  page: number,
  limit: number
): Promise<BlogsResponse> {
  const res = await fetch(
    `http://localhost:5000/api/blog?page=${page}&limit=${limit}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  return res.json();
}