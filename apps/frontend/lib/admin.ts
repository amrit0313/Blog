import { apiRequest, ApiError } from "./api";

export interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AdminBlog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  status: "draft" | "published" | "unpublished";
  image?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name?: string;
    email?: string;
  };
  category?: {
    _id: string;
    title?: string;
  };
}

export interface AdminCategory {
  _id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  result: T;
  message: string;
  meta: null;
}

export const adminApi = {
  
  deleteBlog(id: string) {
    return apiRequest<ApiResponse<AdminBlog>>(`/admin/${id}`, {
      method: "DELETE",
    });
  },


  promoteToAdmin(id: string) {
    return apiRequest<{ message: string; user: AdminUser }>(`/admin/${id}`, {
      method: "PATCH",
    });
  },


  listUsers() {
    return apiRequest<AdminUser[]>("/user", { method: "GET" });
  },


  getUser(id: string) {
    return apiRequest<{ message: string; user: AdminUser }>(`/user/${id}`, {
      method: "GET",
    });
  },


  updateUser(data: { name?: string; email?: string }) {
    return apiRequest<{ message: string; updatedUser: AdminUser }>("/user", {
      method: "PATCH",
      data,
    });
  },


  deleteUser(id: string) {
    return apiRequest<{ message: string }>(`/admin/user/${id}`, { method: "DELETE" });
  },

  createUser(data: { name: string; email: string; password: string; role: "admin" | "user" }) {
    return apiRequest<{ message: string; user: AdminUser }>("/admin/user/create", {
      method: "POST",
      data,
    });
  },


  listCategories() {
    return apiRequest<ApiResponse<AdminCategory[]>>("/category", { method: "GET" });
  },


  createCategory(data: { title: string }) {
    return apiRequest<ApiResponse<AdminCategory>>("/category/create", {
      method: "POST",
      data,
    });
  },


  getCategory(id: string) {
    return apiRequest<ApiResponse<AdminCategory>>(`/category/${id}`, {
      method: "GET",
    });
  },


  updateCategory(id: string, data: { title: string }) {
    return apiRequest<ApiResponse<AdminCategory>>(`/category/${id}`, {
      method: "PUT",
      data,
    });
  },

  deleteCategory(id: string) {
    return apiRequest<ApiResponse<AdminCategory>>(`/category/${id}`, {
      method: "DELETE",
    });
  },


  listAllBlogs(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);

    const qs = query.toString();
    return apiRequest<{
      result: AdminBlog[];
      message: string;
      meta: {
        currentPage: number;
        totalPages: number;
        totalBlogs: number;
        limit: number;
      };
    }>(`/admin${qs ? `?${qs}` : ""}`, { method: "GET" });
  },


  unpublishBlog(id: string) {
    return apiRequest<ApiResponse<AdminBlog>>(`/blog/${id}/unpublish`, {
      method: "PATCH",
    });
  },

  deleteBlogById(id: string) {
    return apiRequest<ApiResponse<AdminBlog>>(`/blog/${id}`, {
      method: "DELETE",
    });
  },

  verifyBlog(id: string) {
    return apiRequest<{ message: string; blog: AdminBlog }>(`/admin/blog/${id}/verify`, {
      method: "PATCH",
    });
  },

  rejectBlog(id: string) {
    return apiRequest<{ message: string; blog: AdminBlog }>(`/admin/blog/${id}/reject`, {
      method: "PATCH",
    });
  },
};

export { ApiError };
