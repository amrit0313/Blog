"use client";

import { useState } from "react";
import Card from "../../../../components/dashboard/card";
import Button from "../../../../components/dashboard/button";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/dashboard/table";
import Modal from "../../../../components/dashboard/modal";

const blogs = [
  {
    id: "1",
    title: "Getting Started with Next.js 16",
    category: "Technology",
    status: "Published",
    views: 234,
    likes: 45,
    date: "Sep 20, 2026",
  },
  {
    id: "2",
    title: "Why I Switched to Tailwind CSS 4",
    category: "Technology",
    status: "Published",
    views: 189,
    likes: 32,
    date: "Sep 15, 2026",
  },
  {
    id: "3",
    title: "Building a Blog Platform in Nepal",
    category: "Personal",
    status: "Draft",
    views: 0,
    likes: 0,
    date: "Sep 10, 2026",
  },
  {
    id: "4",
    title: "The Future of AI in Content Writing",
    category: "AI",
    status: "Published",
    views: 567,
    likes: 89,
    date: "Sep 5, 2026",
  },
  {
    id: "5",
    title: "10 Tips for Better Productivity",
    category: "Lifestyle",
    status: "Archived",
    views: 123,
    likes: 21,
    date: "Aug 28, 2026",
  },
];

export default function MyBlogsPage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);

  const handleDelete = (blogId: string) => {
    setSelectedBlog(blogId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Implement delete logic
    setDeleteModalOpen(false);
    setSelectedBlog(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Blogs</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your blog posts in one place.
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/blogs/create")}>
          + New Blog
        </Button>
      </div>

      <Card padding="none">
        <Table striped>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.map((blog) => (
              <TableRow key={blog.id}>
                <TableCell className="font-medium">{blog.title}</TableCell>
                <TableCell>{blog.category}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      blog.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : blog.status === "Draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {blog.status}
                  </span>
                </TableCell>
                <TableCell>{blog.views}</TableCell>
                <TableCell>{blog.likes}</TableCell>
                <TableCell>{blog.date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/blogs/${blog.id}/edit`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(blog.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Are you sure you want to delete this blog? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
