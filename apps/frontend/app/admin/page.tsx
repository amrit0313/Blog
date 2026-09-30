// app/admin/page.tsx
"use client";
import { Box, Card, CardContent, Typography, CircularProgress, Chip } from "@mui/material";
import { BarChart, PieChart } from "@mui/x-charts";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { adminApi, type AdminBlog } from "../../lib/admin";

interface DashboardStats {
  totalBlogs: number;
  published: number;
  totalUsers: number;
  totalCategories: number;
}

export default function AdminOverview() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [submittedBlogs, setSubmittedBlogs] = useState<AdminBlog[]>([]);
  const [blogsByCategory, setBlogsByCategory] = useState<{ name: string; count: number }[]>([]);
  const [blogsByStatus, setBlogsByStatus] = useState<{ label: string; value: number }[]>([]);
  const [error, setError] = useState("");

  const categoryChartData = useMemo(() => blogsByCategory.map((c) => c.name), [blogsByCategory]);
  const categoryChartSeries = useMemo(() => blogsByCategory.map((c) => c.count), [blogsByCategory]);
  const statusChartData = useMemo(() => blogsByStatus.map((s, i) => ({ id: i, value: s.value, label: s.label })), [blogsByStatus]);

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;

    async function fetchStats() {
      try {
        const [blogsRes, usersRes, categoriesRes] = await Promise.all([
          adminApi.listAllBlogs({ limit: 100 }),
          adminApi.listUsers(),
          adminApi.listCategories(),
        ]);
        const blogs = "result" in blogsRes ? blogsRes.result : [];
        const published = blogs.filter(
          (b: { status: string }) => b.status === "published"
        ).length;
        const submitted = blogs.filter(
          (b: { status: string }) => b.status === "submitted"
        );

        // Blogs per category — use all categories from the API, even those with zero blogs
        const categories = Array.isArray(categoriesRes.result) ? categoriesRes.result : [];
        const categoryMap: Record<string, number> = {};
        categories.forEach((c) => {
          categoryMap[c.title ?? ""] = 0;
        });
        blogs.forEach((b: AdminBlog) => {
          const cat = b.category?.title;
          if (cat && cat in categoryMap) {
            categoryMap[cat] += 1;
          }
        });
        setBlogsByCategory(
          Object.entries(categoryMap).map(([name, count]) => ({ name, count }))
        );

        // Blogs by status
        const statusMap: Record<string, number> = {};
        blogs.forEach((b: AdminBlog) => {
          statusMap[b.status] = (statusMap[b.status] ?? 0) + 1;
        });
        setBlogsByStatus(
          Object.entries(statusMap).map(([label, value]) => ({ label, value }))
        );

        setStats({
          totalBlogs: blogs.length,
          published,
          totalUsers: Array.isArray(usersRes) ? usersRes.length : 0,
          totalCategories: Array.isArray(categoriesRes.result) ? categoriesRes.result.length : 0,
        });
        setSubmittedBlogs(submitted);
      } catch (err) {
        setError("Failed to load dashboard data.");
      }
    }

    fetchStats();
  }, [authLoading, user]);

  if (authLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (user?.role !== "admin") {
    return (
      <Typography variant="h6" color="error">
        you dont have access to this page
      </Typography>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!stats) {
    return <CircularProgress />;
  }

  const statCards = [
    { label: "Total Blogs", value: stats.totalBlogs, href: "/admin/blogs" },
    { label: "Published", value: stats.published, href: "/admin/blogs" },
    { label: "Total Users", value: stats.totalUsers, href: "/admin/users" },
    { label: "Total Categories", value: stats.totalCategories, href: "/admin/categories" },
  ];

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Admin Dashboard
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        }}
      >
        {statCards.map((s) => (
          <Card
            key={s.label}
            onClick={() => router.push(s.href)}
            sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
          >
            <CardContent>
              <Typography sx={{ color: "text.secondary" }}>{s.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Analytics */}
      <Typography variant="h6" sx={{ fontWeight: 600, mt: 5, mb: 2 }}>
        Analytics
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mb: 5,
        }}
      >
        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Blogs per Category</Typography>
            {blogsByCategory.length > 0 ? (
              <BarChart
                xAxis={[{ scaleType: "band", data: categoryChartData }]}
                series={[{ data: categoryChartSeries, color: "#A0522D" }]}
                height={250}
              />
            ) : (
              <Typography color="text.secondary">No data available.</Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Blogs by Status</Typography>
            {blogsByStatus.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: statusChartData,
                  },
                ]}
                height={250}
              />
            ) : (
              <Typography color="text.secondary">No data available.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mt: 5, mb: 2 }}>
        New Blogs to Review
      </Typography>
      {submittedBlogs.length === 0 ? (
        <Typography color="text.secondary">No blogs waiting for review.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {submittedBlogs.map((blog) => (
            <Card
              key={blog._id}
              onClick={() => router.push(`/admin/blogs/${blog._id}`)}
              sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 }}}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{blog.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      By {blog.author?.name ?? "Unknown"}
                    </Typography>
                  </Box>
                  <Chip size="small" label={blog.status} color="warning" />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}

