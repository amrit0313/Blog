"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "../../lib/category";

export default function BlogFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "";

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    params.set("page", "1");
    const query = params.toString();
    router.push(query ? `/blogs?${query}` : "/blogs");
  };

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="category-filter"
        className="text-sm font-medium text-foreground"
      >
        Category
      </label>
      <select
        id="category-filter"
        value={selectedCategory}
        onChange={(event) => handleCategoryChange(event.target.value)}
        className="h-10 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
      >
        <option value="">All</option>
        {categories.map((category) => (
          <option key={category._id} value={category.title}>
            {category.title}
          </option>
        ))}
      </select>
    </div>
  );
}