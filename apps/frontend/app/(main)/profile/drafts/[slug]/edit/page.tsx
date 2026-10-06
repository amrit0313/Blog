"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import Button from "../../../../../../components/ui/Button";
import {
  Form,
  FormField,
  Input,
  Select,
} from "../../../../../../components/dashboard/form";
import RichTextEditor from "../../../../../../components/RichTextEditor";
import { blogApi, type Blog } from "../../../../../../lib/blog";
import { categoryApi, type Category } from "../../../../../../lib/category";
import { ApiError } from "../../../../../../lib/api";
import { imgSrc } from "../../../../../../utils/getImgSrc";

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const editBlogSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  description: yup
    .string()
    .required("Description is required")
    .test(
      "min-text",
      "Description should be at least 20 characters",
      (v) => stripHtml(v ?? "").length >= 20,
    ),
  category: yup.string().required("Please select a category"),
  status: yup
    .mixed<"draft" | "submitted">()
    .oneOf(["draft", "submitted"])
    .required(),
});

export default function EditDraft({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const [blogRes, categoryRes] = await Promise.all([
          blogApi.getDraftBySlug(slug),
          categoryApi.list(),
        ]);
        const fetchedBlog = blogRes.result;
        setBlog(fetchedBlog);
        setTitle(fetchedBlog.title);
        setDescription(fetchedBlog.description);
        setCategory(fetchedBlog.category?._id ?? "");
        setStatus(fetchedBlog.status === "submitted" ? "submitted" : "draft");
        setTagsInput((fetchedBlog.tags ?? []).join(", "));
        setCategories(categoryRes.result ?? []);
      } catch {
        setError("Failed to load blog. Please try again later.");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [slug]);

  const validate = async () => {
    try {
      await editBlogSchema.validate(
        { title, description, category, status },
        { abortEarly: false },
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
      formData.append("tags", tagsInput);

      if (image) formData.append("image", image);

      await blogApi.updateBySlug(slug, formData);
      router.push(`/profile/drafts`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update blog. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading blog...</p>
      </div>
    );
  }

  if (error && !blog) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="mt-2 text-3xl font-bold text-foreground">Edit Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Update your blog post below.
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
          <RichTextEditor
            id="description"
            content={description}
            onChange={setDescription}
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
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "submitted")
              }
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submit</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Tags" htmlFor="tags" hint="Separate tags with commas, e.g. travel, food, nepal">
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="travel, food, nepal"
          />
        </FormField>
        <FormField label="Cover Image" htmlFor="image">
          {blog?.image && !image && (
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc(blog.image, "blogs")}
                alt="Current cover"
                className="aspect-video w-20 h-20 rounded-md border border-border object-cover"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Current cover image
              </p>
            </div>
          )}
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-[#c92f3d]"
          />
          {imagePreview && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected cover preview"
                className="aspect-video w-20 h-20 rounded-md border border-border object-cover"
              />
            </div>
          )}
        </FormField>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
