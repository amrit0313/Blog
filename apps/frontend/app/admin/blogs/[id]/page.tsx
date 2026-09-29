// app/admin/blogs/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography, CircularProgress,
  Card, CardContent, Divider,Dialog,DialogTitle,DialogContent,DialogActions
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "sonner";
import { blogApi, type Blog } from "../../../../lib/blog";
import { adminApi } from "../../../../lib/admin";
import { ApiError } from "../../../../lib/api";

interface AdminBlogDetailPageProps {
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

export default function AdminBlogDetailPage({ params }: AdminBlogDetailPageProps) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");
  const [action, setAction] = useState<"verify" | "reject" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

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
  }, [id]);

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
          onClick={() => router.push("/admin/blogs")}
          sx={{ mt: 2 }}
        >
          Back to Blogs
        </Button>
      </Box>
    );
  }

  async function handleAction() {
    if (!blog || !action) return;
    setProcessing(true);
    try {
      if (action === "verify") {
        await adminApi.verifyBlog(blog._id);
        setBlog((prev) => prev ? { ...prev, status: "published" } : prev);
        toast.success("Blog verified and published.");
      } else {
        await adminApi.rejectBlog(blog._id);
        setBlog((prev) => prev ? { ...prev, status: "rejected" } : prev);
        toast.success("Blog rejected.");
      }
      setAction(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to process blog.");
    } finally {
      setProcessing(false);
    }
  }

  if (!blog) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/blogs")}
        sx={{ mb: 2 }}
      >
        Back to Blogs
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {blog.title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Chip
          size="small"
          label={blog.status}
          color={blog.status === "published" ? "success" : blog.status === "rejected" ? "error" : "warning"}
        />
        <Typography variant="body2" color="text.secondary">
          By {blog.author?.name ?? "Unknown"}
        </Typography>
        {blog.category?.title && (
          <Typography variant="body2" color="text.secondary">
            in {blog.category.title}
          </Typography>
        )}
      </Box>

      {blog.status === "submitted" && (
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setAction("verify")}
          >
            Verify
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setAction("reject")}
          >
            Reject
          </Button>
        </Box>
      )}

      {blog.image && (
        <Box
          component="img"
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/blogs/${blog.image}`}
          alt={blog.title}
          sx={{
            width: "100%",
            maxHeight: 400,
            objectFit: "cover",
            borderRadius: 2,
            mb: 3,
          }}
        />
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Description
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {blog.description}
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(blog.createdAt) ?? "Unknown"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {formatDate(blog.updatedAt) ?? "Unknown"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Verify/Reject Confirmation Dialog */}
      {action && (
        <Dialog open onClose={() => setAction(null)}>
          <DialogTitle>{action === "verify" ? "Verify Blog" : "Reject Blog"}</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {action} this blog?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              color={action === "verify" ? "success" : "error"}
              variant="contained"
              disabled={processing}
            >
              {processing ? "Processing..." : action === "verify" ? "Yes, Verify" : "Yes, Reject"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
