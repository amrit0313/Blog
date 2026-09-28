// app/admin/page.tsx
"use client";
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../lib/admin";

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
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;

    async function fetchStats() {
      try {
        const [blogsRes, usersRes, categoriesRes] = await Promise.all([
          adminApi.listAllBlogs({ limit: 10}),
          adminApi.listUsers(),
          adminApi.listCategories(),
        ]);
        console.log(categoriesRes)
        const blogs = "result" in blogsRes ? blogsRes.result : [];
        const published = blogs.filter(
          (b: { status: string }) => b.status === "published"
        ).length;

        setStats({
          totalBlogs: blogs.length,
          published,
          totalUsers: Array.isArray(usersRes) ? usersRes.length : 0,
          totalCategories: Array.isArray(categoriesRes.result) ? categoriesRes.result.length : 0,
        });
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
    </>
  );
}