"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { blogApi, type Blog } from "../../../../lib/blog";
import { ApiError } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/dashboard/badge";
import Modal from "../../../../components/dashboard/modal";
import Link from "next/link";

interface BlogDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id || authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBlog = async () => {
      try {
        setError("");
        const res = await blogApi.getById(id);
        setBlog(res.result);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError("Blog not found.");
        } else {
          setError("Unable to load this blog. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, authLoading, user]);

  const isAuthor = user && blog && user.id === blog.author?._id;

  const handleDelete = async () => {
    if (!blog) return;
    setDeleteLoading(true);
    try {
      await blogApi.delete(blog._id);
      router.push("/blogs");
    } catch {
      setError("Failed to delete blog. Please try again.");
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Sign in to read this story
          </h1>
          <p className="mt-3 text-muted-foreground">
            Log in to access the full blog details and join the conversation.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button>Log in to continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <p className="mt-2 text-muted-foreground">
            The blog you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/blogs" className="mt-6 inline-block">
            <Button variant="outline">Back to Blogs</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
      <header className="mb-8">
        <Link
          href="/blogs"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          &larr; Back to Blogs
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {blog.title}
          </h1>
          <Badge
            variant={
              blog.status === "published"
                ? "success"
                : blog.status === "draft"
                  ? "warning"
                  : "default"
            }
          >
            {blog.status}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">By</span>
            {blog.author?.name ?? "Unknown"}
          </span>
          {blog.category?.title && (
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Category</span>
              {blog.category.title}
            </span>
          )}
          {formatDate(blog.createdAt) && (
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Published</span>
              {formatDate(blog.createdAt)}
            </span>
          )}
        </div>

        {isAuthor && (
          <div className="mt-6 flex gap-3">
            <Link href={`/blogs/${blog._id}/edit`}>
              <Button variant="outline">Edit Blog</Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete Blog
            </Button>
          </div>
        )}
      </header>

      {blog.image && (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/blogs/${blog.image}`}
          alt={blog.title}
          className="mb-8 aspect-video w-full rounded-lg border border-border object-cover"
        />
      )}

      <div className="prose prose-neutral max-w-none">
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">
          {blog.description}
        </p>
      </div>

      <footer className="mt-12 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>Last updated: {formatDate(blog.updatedAt) ?? "Unknown"}</span>
          <Link href="/blogs">
            <Button variant="outline">More Blogs</Button>
          </Link>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Blog"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Are you sure you want to delete &quot;{blog.title}&quot;? This action
          cannot be undone.
        </p>
      </Modal>
    </article>
  );
}
