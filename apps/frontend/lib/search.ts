import { apiRequest } from "./api";

export interface SearchUser {
  _id: string;
  name: string;
  avatar?: string | { key?: string; url?: string } | null;
  isVerified?: boolean;
}

export interface SearchBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags?: string[];
  author?: { _id: string; name?: string };
  category?: { _id: string; title?: string };
}

export interface SearchResponse {
  result: { users: SearchUser[]; blogs: SearchBlog[] };
  message: string;
  meta: null;
}

export const searchApi = {
  search(q: string) {
    return apiRequest<SearchResponse>("/search", {
      method: "GET",
      params: { q },
    });
  },
};