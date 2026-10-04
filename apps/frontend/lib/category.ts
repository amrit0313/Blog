import { apiRequest } from "./api";

/**
 * Category data returned by the category endpoints.
 */
export interface Category {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response returned when listing categories.
 */
export interface CategoryListResponse {
  result: Category[];
  message: string;
  meta: null;
}

/**
 * Client methods for retrieving and creating blog categories.
 */
export const categoryApi = {
  /**
   * Lists all categories.
   *
   * @returns A promise containing the available categories.
   */
  list() {
    return apiRequest<CategoryListResponse>("/category", { method: "GET" });
  },

  /**
   * Retrieves a category by ID.
   *
   * @param id - ID of the category to retrieve.
   * @returns A promise containing the requested category.
   */
  getById(id: string) {
    return apiRequest<{ result: Category; message: string; meta: null }>(
      `/category/${id}`,
      { method: "GET" },
    );
  },

  /**
   * Creates a new category.
   *
   * @param data - Category data containing the title.
   * @returns A promise containing the created category.
   */
  create(data: { title: string }) {
    return apiRequest<{ result: Category; message: string; meta: null }>(
      "/category/create",
      { method: "POST", data },
    );
  },
};
