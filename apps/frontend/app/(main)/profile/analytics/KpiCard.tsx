"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface KpiCardProps {
  label: string;
  value: number;
  icon: SvgIconComponent;
  tooltip?: string;
  unit?: string;
  accentColor?: string;
  isLoading?: boolean;
  animationDelay?: number;
}

function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

export const KpiCard = React.memo(function KpiCard({
  label,
  value,
  icon: Icon,
  tooltip,
  unit = "",
  accentColor = "#e63946",
  isLoading = false,
  animationDelay = 0,
}: KpiCardProps) {
  const displayValue = useCountUp(isLoading ? 0 : value);

  return (
    <Tooltip title={tooltip ?? ""} arrow disableHoverListener={!tooltip}>
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          background: "#ffffff",
          transition: "transform 200ms ease, box-shadow 200ms ease",
          cursor: tooltip ? "help" : "default",
          animationDelay: `${animationDelay}ms`,
          animationFillMode: "both",
          "@keyframes slideUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          animation: "slideUp 400ms ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 12px 32px rgba(72,45,28,0.12)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            transition: "none",
            "&:hover": { transform: "none" },
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {isLoading ? (
            <>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" sx={{ mt: 2, fontSize: "2rem", width: "60%" }} />
              <Skeleton variant="text" sx={{ mt: 1, width: "80%" }} />
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: `${accentColor}18`,
                  mb: 2,
                }}
              >
                <Icon sx={{ color: accentColor, fontSize: 22 }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                {displayValue}
                {unit && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: "0.875rem",
                      color: "text.secondary",
                      fontWeight: 500,
                      ml: 0.5,
                    }}
                  >
                    {unit}
                  </Box>
                )}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.75,
                  fontWeight: 500,
                }}
              >
                {label}
              </Typography>

              {/* Accent bottom bar */}
              <Box
                sx={{
                  mt: 2,
                  height: 3,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
                  width: "100%",
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
});
