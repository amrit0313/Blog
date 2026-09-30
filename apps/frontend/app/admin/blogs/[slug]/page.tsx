// app/admin/blogs/[id]/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography, CircularProgress,
  Card, CardContent, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { blogApi, type Blog } from "../../../../lib/blog";
import { adminApi } from "../../../../lib/admin";
import { imgSrc } from "../../../../utils/getImgSrc";
import { ApiError } from "../../../../lib/api";

interface AdminBlogDetailPageProps {
  params: Promise<{ slug: string }>;
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

function getBlogImageUrl(image?: string) {
  if (!image) return null;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/uploads/blogs/${image}`;
}

export default function AdminBlogDetailPage({ params }: AdminBlogDetailPageProps) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState<string>("");
  const [action, setAction] = useState<"verify" | "reject" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      try {
        setError("");
        const res = await blogApi.getBySlug(slug);
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
  }, [slug]);

  const sanitizedHtml = useMemo(() => {
    if (!blog?.description) return "";
    return DOMPurify.sanitize(blog.description);
  }, [blog?.description]);

  async function handleAction() {
    if (!blog || !action) return;
    setProcessing(true);
    try {
      if (action === "verify") {
        await adminApi.verifyBlog(blog._id);
        setBlog((prev) => (prev ? { ...prev, status: "published" } : prev));
        toast.success("Blog verified and published.");
      } else {
        await adminApi.rejectBlog(blog._id);
        setBlog((prev) => (prev ? { ...prev, status: "rejected" } : prev));
        toast.success("Blog rejected.");
      }
      setAction(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to process blog.",
      );
    } finally {
      setProcessing(false);
    }
  }

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
        <Typography variant="h6" color="error">
          {error}
        </Typography>
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

  if (!blog) return null;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 } }}>

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/blogs")}
        sx={{ mb: 3 }}
      >
        Back to Blogs
      </Button>

      {/* Title */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" } }}
      >
        {blog.title}
      </Typography>

      {blog.category?.title && (
        <Box sx={{ mb: 2 }}>
          <Typography component="span" variant="body1" color="text.secondary" sx={{ mr: 1 }}>
            Category:
          </Typography>
          <Chip
            size="medium"
            label={blog.category.title}
            color="info"
            sx={{ "& .MuiChip-label": { fontSize: "0.9rem", fontWeight: 600 } }}
          />
        </Box>
      )}

      {/* Author / date / status */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {blog.author?.name?.charAt(0).toUpperCase() ?? "?"}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {blog.author?.name ?? "Unknown"}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">·</Typography>

        {formatDate(blog.createdAt) && (
          <>
            <Typography variant="body2" color="text.secondary">
              {formatDate(blog.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">·</Typography>
          </>
        )}

        <Chip
          size="small"
          label={blog.status}
          color={
            blog.status === "published"
              ? "success"
              : blog.status === "rejected"
                ? "error"
                : "warning"
          }
        />
      </Box>

      {/* Cover image */}
      {blog.image && (
        <Box
          component="img"
          src={imgSrc(blog.image, "blogs")}
          alt={blog.title}
          sx={{
            width: "100%",
            maxHeight: 380,
            objectFit: "cover",
            borderRadius: 2,
            mb: 4,
            border: 1,
            borderColor: "divider",
          }}
        />
      )}

      {/* Content */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(blog.createdAt) ?? "Unknown"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {formatDate(blog.updatedAt) ?? "Unknown"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {blog.status === "submitted" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setAction("verify")}
          >
            Verify
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setAction("reject")}
          >
            Reject
          </Button>
        </Box>
      )}

      {/* Verify/Reject confirmation dialog */}
      {/* Verify/Reject Confirmation Dialog */}
      {action && (
        <Dialog open onClose={() => !processing && setAction(null)}>
          <DialogTitle>
            {action === "verify" ? "Verify Blog" : "Reject Blog"}
          </DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to {action} this blog?</Typography>
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
              {processing
                ? "Processing..."
                : action === "verify"
                  ? "Yes, Verify"
                  : "Yes, Reject"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <style jsx global>{`
        .blog-prose {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--foreground, #000);
        }
        .blog-prose > * + * {
          margin-top: 1.25em;
        }
        .blog-prose p {
          color: var(--foreground, #000);
        }
        .blog-prose strong {
          font-weight: 700;
        }
        .blog-prose em {
          font-style: italic;
        }
        .blog-prose h1 { font-size: 2rem; font-weight: 800; margin-top: 2em; margin-bottom: 0.75em; line-height: 1.3; }
        .blog-prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.75em; margin-bottom: 0.5em; line-height: 1.35; }
        .blog-prose h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
        .blog-prose blockquote {
          border-left: 4px solid var(--primary, #7c3aed);
          background: rgba(124, 58, 237, 0.05);
          border-radius: 0 8px 8px 0;
          padding: 1rem 1.25rem;
          margin: 1.5em 0;
          font-style: italic;
        }
        .blog-prose ul { list-style-type: disc; padding-left: 1.75rem; }
        .blog-prose ol { list-style-type: decimal; padding-left: 1.75rem; }
        .blog-prose li { padding-left: 0.375rem; margin-top: 0.375em; }
        .blog-prose a { color: var(--primary, #7c3aed); text-decoration: underline; text-underline-offset: 3px; }
        .blog-prose code { background: rgba(0,0,0,0.06); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em; }
        .blog-prose pre { background: #1a1a1a; color: #f5f5f5; padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-size: 0.875rem; line-height: 1.6; }
        .blog-prose pre code { background: none; padding: 0; border-radius: 0; font-size: inherit; color: inherit; }
        .blog-prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5em 0; }
        .blog-prose hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
      `}</style>
    </Box>
  );
}
