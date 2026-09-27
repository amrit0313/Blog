import { apiRequest } from "./api";

export interface Category {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListResponse {
  result: Category[];
  message: string;
  meta: null;
}

export const categoryApi = {
  list() {
    return apiRequest<CategoryListResponse>("/category", { method: "GET" });
  },

  getById(id: string) {
    return apiRequest<{ result: Category; message: string; meta: null }>(
      `/category/${id}`,
      { method: "GET" }
    );
  },

  create(data: { title: string }) {
    return apiRequest<{ result: Category; message: string; meta: null }>(
      "/category/create",
      { method: "POST", data }
    );
  },
};
