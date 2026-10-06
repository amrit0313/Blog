"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { TopPost } from "./useAnalyticsData";

const STATUS_COLORS: Record<string, string> = {
  featured: "#b91c1c",
  published: "#e63946",
  draft: "#f4a261",
  unpublished: "#6b7280",
  submitted: "#457b9d",
  rejected: "#b92535",
};

interface TopPostsListProps {
  posts: TopPost[];
  maxViews: number;
  isLoading?: boolean;
}

export const TopPostsList = React.memo(function TopPostsList({
  posts,
  maxViews,
  isLoading = false,
}: TopPostsListProps) {
  if (isLoading) {
    return (
      <Stack spacing={2.5}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i}>
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
            <Skeleton
              variant="rectangular"
              height={6}
              sx={{ mt: 1, borderRadius: 99 }}
            />
          </Box>
        ))}
      </Stack>
    );
  }

  if (posts.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <VisibilityIcon sx={{ color: "divider", fontSize: 48 }} />
        <Typography color="text.secondary" variant="body2">
          No posts yet. Start writing to see your top performers!
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2.5} component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {posts.map((post, i) => {
        const pct = maxViews > 0 ? (post.views / maxViews) * 100 : 0;
        const color = STATUS_COLORS[post.status] ?? "#6b7280";
        return (
          <Box component="li" key={post._id}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                mb: 0.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.disabled", minWidth: 18 }}
                >
                  #{i + 1}
                </Typography>
                <Link
                  href={`/blogs/${post.slug}`}
                  style={{
                    color: "#16213e",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {post.title}
                </Link>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Chip
                  label={post.status}
                  size="small"
                  sx={{
                    bgcolor: `${color}18`,
                    color,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 22,
                    display: { xs: "none", sm: "flex" },
                  }}
                />
                {/* Views */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#457b9d",
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: 14 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#457b9d" }}
                  >
                    {post.views.toLocaleString()}
                  </Typography>
                </Box>
                {/* Likes */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#e63946",
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 14 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#e63946" }}
                  >
                    {post.likes}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 6,
                borderRadius: 99,
                bgcolor: "#f0f4f8",
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, #457b9d, #457b9d55)`,
                  borderRadius: 99,
                },
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
});
