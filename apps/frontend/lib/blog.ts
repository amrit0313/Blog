import { apiRequest } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Blog {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "published" | "unpublished";
  image?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface BlogsResponse {
  success: boolean;
  blogs: Blog[];
  totalBlogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ApiResponse<T> {
  result: T;
  message: string;
  meta: null;
}

export interface BlogAuthor {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
}

export interface BlogCategory {
  id?: string;
  _id?: string;
  title?: string;
}

export interface BlogSummary {
  _id: string;
  title: string;
  description?: string;
  author?: BlogAuthor;
  category?: BlogCategory;
  status?: "draft" | "published" | string;
  createdAt?: string;
  updatedAt?: string;
}

interface BlogListResponse {
  message?: string;
  result?: BlogSummary[];
}

export async function getBlogs(): Promise<BlogsResponse> {
  const res = await fetch(`${API_URL}/api/blog`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  return res.json();
}

export async function getBlogById(id: string): Promise<ApiResponse<Blog>> {
  const res = await fetch(`${API_URL}/api/blog/${id}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch blog");
  }

  return res.json();
}

export async function createBlog(data: FormData): Promise<ApiResponse<Blog>> {
  const res = await fetch(`${API_URL}/api/blog/create`, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    throw new Error("Failed to create blog");
  }

  return res.json();
}

export async function updateBlog(
  id: string,
  data: FormData,
): Promise<ApiResponse<Blog>> {
  const res = await fetch(`${API_URL}/api/blog/${id}`, {
    method: "PUT",
    body: data,
  });

  if (!res.ok) {
    throw new Error("Failed to update blog");
  }

  return res.json();
}

export async function deleteBlog(id: string): Promise<ApiResponse<Blog>> {
  const res = await fetch(`${API_URL}/api/blog/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete blog");
  }

  return res.json();
}

export async function unpublishBlog(id: string): Promise<ApiResponse<Blog>> {
  const res = await fetch(`${API_URL}/api/blog/${id}/unpublish`, {
    method: "PATCH",
  });

  if (!res.ok) {
    throw new Error("Failed to unpublish blog");
  }

  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/api/user`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();
  return data.result || data;
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_URL}/api/user/${id}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}

export async function updateUser(data: {
  name?: string;
  email?: string;
}): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_URL}/api/user`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update user");
  }

  return res.json();
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_URL}/api/auth/me`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  return res.json();
}

export const blogApi = {
  myBlogs() {
    return apiRequest<BlogListResponse>("/blog/me", { method: "GET" });
  },
};
