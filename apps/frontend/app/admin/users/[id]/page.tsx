// app/admin/users/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography, CircularProgress,
  Card, CardContent, Divider, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { toast } from "sonner";
import { adminApi, type AdminUser, type AdminBlog } from "../../../../lib/admin";
import { ApiError } from "../../../../lib/api";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setError("");
        const res = await adminApi.getUser(id);
        setUser(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError("User not found.");
        } else {
          setError("Unable to load this user. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  useEffect(() => {
    if (!id || user?.role !== "user") {
      setBlogsLoading(false);
      return;
    }

    adminApi
      .listAllBlogs({ limit: 100 })
      .then((res) => {
        const allBlogs = "result" in res ? res.result : [];
        const userBlogs = allBlogs.filter(
          (b) => b.author?._id === id
        );
        setBlogs(userBlogs);
      })
      .catch(() => toast.error("Failed to load user blogs."))
      .finally(() => setBlogsLoading(false));
  }, [id, user]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">{error}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/users")}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/users")}
        sx={{ mb: 2 }}
      >
        Back to Users
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
            <Avatar
              sx={{ width: 80, height: 80, fontSize: "2rem" }}
            >              name={user.name}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography color="text.secondary">{user.email}</Typography>
              <Chip
                size="small"
                label={user.role === "admin" ? "Admin" : "User"}
                color={user.role === "admin" ? "primary" : "default"}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">User ID</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{user._id}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Role</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.role ?? "user"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.email ?? "—"}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* User blogs — only for non-admin users */}
      {user.role === "user" && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Blogs by {user.name}
          </Typography>
          {blogsLoading ? (
            <CircularProgress size={24} />
          ) : blogs.length === 0 ? (
            <Typography color="text.secondary">No blogs found for this user.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {blogs.map((blog) => (
                <Card
                  key={blog._id}
                  onClick={() => router.push(`/admin/blogs/${blog.slug}`)}
                  sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{blog.title}</Typography>
                      <Chip
                        size="small"
                        label={blog.status}
                        color={blog.status === "published" ? "success" : blog.status === "rejected" ? "error" : "warning"}
                      />
                    </Box>
                    {blog.category?.title && (
                      <Typography variant="body2" color="text.secondary">
                        Category: {blog.category.title}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
