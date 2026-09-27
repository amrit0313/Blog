"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import Button from "../../../../components/ui/Button";
import {
  Form,
  FormField,
  Input,
  Textarea,
  Select,
} from "../../../../components/dashboard/form";
import { blogApi } from "../../../../lib/blog";
import { categoryApi, type Category } from "../../../../lib/category";
import { ApiError } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";

const createBlogSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  description: yup
    .string()
    .trim()
    .required("Description is required")
    .min(20, "Description should be at least 20 characters"),
  category: yup.string().required("Please select a category"),
  status: yup
    .mixed<"draft" | "published">()
    .oneOf(["draft", "published"])
    .required(),
});

export default function CreateBlogPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [image, setImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.result ?? []))
      .catch(() => setCategories([]));
  }, []);

  const validate = async () => {
    try {
      await createBlogSchema.validate(
        { title, description, category, status },
        { abortEarly: false }
      );
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((issue) => {
          if (issue.path && !errors[issue.path]) {
            errors[issue.path] = issue.message;
          }
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isValid = await validate();
    if (!isValid) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("status", status);
      if (user?.id) formData.append("author", user.id);
      if (image) formData.append("image", image);

      const res = await blogApi.create(formData);
      router.push(`/blogs/${res.result._id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create blog. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-8">
      <div className="mb-8">
        <p className="eyebrow">Write</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Create New Blog
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share your story with the community.
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="Author" htmlFor="author">
          <div className="flex h-[38px] items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
            {authLoading ? "Loading..." : user?.name ?? "Unknown"}
          </div>
        </FormField>

        <FormField
          label="Title"
          htmlFor="title"
          required
          error={fieldErrors.title}
        >
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your blog title"
            maxLength={120}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="description"
          required
          error={fieldErrors.description}
        >
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your blog content..."
            rows={8}
          />
        </FormField>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            label="Category"
            htmlFor="category"
            required
            error={fieldErrors.category}
          >
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Status" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Cover Image" htmlFor="image">
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-[#c92f3d]"
          />
          {image && (
            <p className="mt-2 text-sm text-muted-foreground">
              Selected: {image.name}
            </p>
          )}
        </FormField>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6 px-4 sm:px-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Blog"}
          </Button>
        </div>
      </Form>
    </div>
  );
}