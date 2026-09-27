import { apiRequest } from "./api";

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

export const blogApi = {
  myBlogs() {
    return apiRequest<BlogListResponse>("/blog/me", { method: "GET" });
  },
};
