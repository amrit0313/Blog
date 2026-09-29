import { apiRequest, ApiError } from "./api";

export interface BlogAuthor {
  _id: string;
  name?: string;
  email?: string;
}

export interface BlogCategory {
  _id: string;
  title?: string;
}

export interface Blog {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "published" | "unpublished" | "submitted" | "rejected";
  image?: string;
  createdAt: string;
  updatedAt: string;
  author: BlogAuthor;
  category?: BlogCategory;
}

export interface BlogListMeta {
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
  limit: number;
}

export interface BlogListApiResponse {
  result: Blog[];
  message: string;
  meta: BlogListMeta;
}

export interface ApiResponse<T> {
  result: T;
  message: string;
  meta: null;
}

export const blogApi = {
  // GET /api/blog
  list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);

    const qs = query.toString();
    return apiRequest<BlogListApiResponse>(`/blog${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  myBlogs() {
    return apiRequest<BlogListApiResponse>("/blog/me", { method: "GET" });
  },

  create(data: FormData) {
    return apiRequest<ApiResponse<Blog>>("/blog/create", {
      method: "POST",
      data,
    });
  },

  getById(id: string) {
    return apiRequest<ApiResponse<Blog>>(`/blog/${id}`, { method: "GET" });
  },

  getBySlug(slug: string) {
    return apiRequest<ApiResponse<Blog>>(`/blog/slug/${slug}`, {
      method: "GET",
    });
  },

  update(id: string, data: FormData) {
    console.log(data)
    return apiRequest<ApiResponse<Blog>>(`/blog/${id}`, {
      method: "PUT",
      data,
    });
  },

  // DELETE /api/blog/:id (auth required)
  delete(id: string) {
    return apiRequest<ApiResponse<Blog>>(`/blog/${id}`, {
      method: "DELETE",
    });
  },

  // PATCH /api/blog/:id/unpublish (auth required, admin only)
  unpublish(id: string) {
    return apiRequest<ApiResponse<Blog>>(`/blog/${id}/unpublish`, {
      method: "PATCH",
    });
  },
};

export { ApiError };
