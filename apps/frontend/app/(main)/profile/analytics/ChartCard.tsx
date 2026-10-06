"use client";

import React from "react";
import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  minHeight?: number;
  action?: React.ReactNode;
}

export const ChartCard = React.memo(function ChartCard({
  title,
  subtitle,
  isLoading = false,
  children,
  minHeight = 260,
  action,
}: ChartCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        background: "#ffffff",
        height: "100%",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": {
          boxShadow: "0 8px 28px rgba(72,45,28,0.10)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": { boxShadow: "none" },
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2.5,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            {isLoading ? (
              <>
                <Skeleton variant="text" width={160} height={28} />
                {subtitle && <Skeleton variant="text" width={100} height={20} />}
              </>
            ) : (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          {!isLoading && action && <Box>{action}</Box>}
        </Box>

        {isLoading ? (
          <Skeleton
            variant="rectangular"
            height={minHeight}
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <Box sx={{ minHeight }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
});
