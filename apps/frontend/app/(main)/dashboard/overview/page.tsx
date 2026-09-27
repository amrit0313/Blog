"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "../../../../components/dashboard/card";
import Button from "../../../../components/dashboard/button";
import Badge from "../../../../components/dashboard/badge";
import Avatar from "../../../../components/dashboard/avatar";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/dashboard/table";
import Modal from "../../../../components/dashboard/modal";
import { getErrorMessage } from "../../../../lib/toast";
import { toast } from "sonner";
import {
  getBlogs,
  getUsers,
  deleteBlog,
  updateBlog,
  type Blog,
  type User,
} from "../../../../lib/blog";

type FilterTab = "all" | "published" | "draft";

export default function OverviewPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [blogsData, usersData] = await Promise.all([
          getBlogs(),
          getUsers(),
        ]);

        // Use first user as placeholder current user
        const currentUser = usersData[0] || null;
        setUser(currentUser);

        // Filter blogs by current user
        if (currentUser) {
          setBlogs(
            blogsData.blogs.filter(
              (blog) => blog.author?._id === currentUser._id,
            ),
          );
        } else {
          setBlogs(blogsData.blogs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = {
    total: blogs.length,
    published: blogs.filter((b) => b.status === "published").length,
    drafts: blogs.filter((b) => b.status === "draft").length,
    memberSince: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "—",
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "published" && blog.status === "published") ||
      (activeTab === "draft" && blog.status === "draft");
    const matchesSearch = blog.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const firstDraft = blogs.find((b) => b.status === "draft");

  const handleDelete = (blog: Blog) => {
    setSelectedBlog(blog);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBlog) return;
    setActionLoading(true);
    try {
      const response = await deleteBlog(selectedBlog._id);
      setBlogs((prev) => prev.filter((b) => b._id !== selectedBlog._id));
      setDeleteModalOpen(false);
      setSelectedBlog(null);
      toast.success(response.message ?? "Blog deleted successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to delete the blog."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    setActionLoading(true);
    try {
      const newStatus =
        blog.status === "published" ? "unpublished" : "published";
      const formData = new FormData();
      formData.append("status", newStatus);
      const res = await updateBlog(blog._id, formData);
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? res.result : b)),
      );
      toast.success(res.message ?? "Blog updated successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update the blog."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card padding="md" className="text-center">
          <p className="text-red-600 font-medium">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your blogs.
          </p>
        </div>
        <Link href="/blogs/create">
          <Button>+ New Blog</Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Total Blogs</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.total}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {stats.published}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {stats.drafts}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.memberSince}
          </p>
        </Card>
      </div>

      {/* Quick Actions - Continue Draft */}
      {firstDraft && (
        <Card padding="md" className="bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                Continue where you left off
              </p>
              <p className="text-sm text-muted-foreground">
                You have a draft: &quot;{firstDraft.title}&quot;
              </p>
            </div>
            <Link href={`/blogs/${firstDraft._id}/edit`}>
              <Button variant="outline">Continue Draft</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* My Blogs */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">My Blogs</h2>
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-border px-6 py-2">
          {(["all", "published", "draft"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <Table striped>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBlogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No blogs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBlogs.map((blog) => (
                <TableRow key={blog._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {blog.image ? (
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                          📄
                        </div>
                      )}
                      <span className="font-medium">{blog.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(blog.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/blogs/${blog._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleToggleStatus(blog)}
                      >
                        {blog.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={actionLoading}
                        onClick={() => handleDelete(blog)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Profile Section */}
      {user && (
        <Card padding="md">
          <h2 className="font-semibold text-foreground mb-4">Profile</h2>
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{user.name}</p>
                <Badge variant={user.role === "admin" ? "info" : "default"}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex gap-2">
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Blog"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Are you sure you want to delete &quot;{selectedBlog?.title}&quot;?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
