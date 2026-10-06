"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BarChart,
  LineChart,
  PieChart,
} from "@mui/x-charts";
import ArticleIcon from "@mui/icons-material/Article";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PublicIcon from "@mui/icons-material/Public";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedIcon from "@mui/icons-material/Verified";

import theme from "../../../../theme/mui-theme";
import { useAuth } from "../../../../context/AuthContext";
import { imgSrc } from "../../../../utils/getImgSrc";

import { useAnalyticsData, type Range } from "./useAnalyticsData";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { TopPostsList } from "./TopPostsList";

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection({
  name,
  email,
  avatarSrc,
  isVerified,
  joinedDaysAgo,
  isLoading,
}: {
  name?: string;
  email?: string;
  avatarSrc?: string | null;
  isVerified?: boolean;
  joinedDaysAgo: number;
  isLoading: boolean;
}) {
  return (
    <Box
      sx={{
        background:
          "linear-gradient(135deg, #e63946 0%, #b92535 40%, #f4a261 100%)",
        borderRadius: { xs: 0, sm: 4 },
        p: { xs: 4, sm: 5 },
        mb: 4,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -40,
          left: "30%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
      >
        {isLoading ? (
          <Skeleton variant="circular" width={80} height={80} />
        ) : (
          <Avatar
            src={avatarSrc ?? undefined}
            alt={name ?? "User"}
            sx={{
              width: 80,
              height: 80,
              fontSize: 32,
              fontWeight: 700,
              bgcolor: "rgba(255,255,255,0.25)",
              border: "3px solid rgba(255,255,255,0.4)",
              color: "#fff",
            }}
          >
            {name?.charAt(0).toUpperCase() ?? "?"}
          </Avatar>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            {isLoading ? (
              <Skeleton variant="text" width={200} height={36} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
            ) : (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#fff" }}
                  noWrap
                >
                  {name ?? "Your Analytics"}
                </Typography>
                {isVerified && (
                  <Tooltip title="Verified account">
                    <VerifiedIcon sx={{ color: "#fff", fontSize: 20 }} />
                  </Tooltip>
                )}
              </>
            )}
          </Box>

          {isLoading ? (
            <Skeleton variant="text" width={160} height={22} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
          ) : (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {email}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}
          >
            {isLoading ? (
              <Skeleton variant="rounded" width={120} height={26} sx={{ bgcolor: "rgba(255,255,255,0.3)", borderRadius: 99 }} />
            ) : (
              <>
                <Chip
                  label="Analytics"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 600,
                    backdropFilter: "blur(4px)",
                  }}
                />
                {joinedDaysAgo > 0 && (
                  <Chip
                    label={`Member for ${joinedDaysAgo}d`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontWeight: 600,
                      backdropFilter: "blur(4px)",
                    }}
                  />
                )}
              </>
            )}
          </Stack>
        </Box>

        {/* Back link */}
        <Chip
          component={Link}
          href="/profile"
          icon={<ArrowBackIcon sx={{ fontSize: "16px !important" }} />}
          label="Profile"
          clickable
          sx={{
            bgcolor: "rgba(255,255,255,0.2)",
            color: "#fff",
            fontWeight: 600,
            backdropFilter: "blur(4px)",
            alignSelf: { xs: "flex-start", sm: "center" },
            flexShrink: 0,
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
          }}
        />
      </Stack>

      {/* Eyebrow */}
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.65)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          display: "block",
          mt: 3,
        }}
      >
        Your Insights Dashboard
      </Typography>
    </Box>
  );
}

// ── Range Switcher ─────────────────────────────────────────────────────────
function RangeSwitcher({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v: Range | null) => {
        if (v) onChange(v);
      }}
      size="small"
      aria-label="Date range"
      sx={{
        "& .MuiToggleButton-root": {
          border: "1px solid",
          borderColor: "divider",
          fontWeight: 600,
          fontSize: "0.75rem",
          px: 2,
          py: 0.75,
          "&.Mui-selected": {
            bgcolor: "#e63946",
            color: "#fff",
            borderColor: "#e63946",
            "&:hover": { bgcolor: "#b92535" },
          },
        },
      }}
    >
      <ToggleButton value="7D">7D</ToggleButton>
      <ToggleButton value="30D">30D</ToggleButton>
      <ToggleButton value="90D">90D</ToggleButton>
    </ToggleButtonGroup>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 10,
        textAlign: "center",
      }}
    >
      <ArticleIcon sx={{ fontSize: 64, color: "#eadfd6" }} />
      <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
        No blogs yet
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", maxWidth: 340 }}
      >
        Write your first blog post and come back here to track your performance.
      </Typography>
      <Chip
        component={Link}
        href="/blogs/create"
        label="Start Writing →"
        clickable
        sx={{
          mt: 1,
          bgcolor: "#e63946",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.875rem",
          height: 36,
          px: 1,
          "&:hover": { bgcolor: "#b92535" },
        }}
      />
    </Box>
  );
}

// ── Views vs Likes Combo Chart ─────────────────────────────────────────────
function ViewsLikesChart({
  data,
  tickStep,
}: {
  data: { date: string; views: number; likes: number }[];
  tickStep: number;
}) {
  const hasData = data.some((d) => d.views > 0 || d.likes > 0);
  if (!hasData) {
    return (
      <Box
        sx={{
          height: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <VisibilityIcon sx={{ fontSize: 40, color: "#eadfd6" }} />
        <Typography color="text.secondary" variant="body2">
          No views or likes in this period.
        </Typography>
      </Box>
    );
  }

  return (
    <LineChart
      xAxis={[
        {
          data: data.map((d) => d.date),
          scaleType: "band",
          tickMinStep: tickStep,
          valueFormatter: (v: string) => v,
        },
      ]}
      series={[
        {
          data: data.map((d) => d.views),
          label: "Views",
          color: "#457b9d",
          area: true,
          showMark: false,
        },
        {
          data: data.map((d) => d.likes),
          label: "Likes",
          color: "#e63946",
          area: false,
          showMark: false,
        },
      ]}
      height={260}
      sx={{
        ".MuiLineElement-root": { strokeWidth: 2.5 },
        ".MuiAreaElement-root": { fillOpacity: 0.10 },
      }}
    />
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  const data = useAnalyticsData();

  // Auth guard
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  const avatarSrc = useMemo(
    () => (data.profile?.avatar ? imgSrc(data.profile.avatar, "profile") : null),
    [data.profile?.avatar],
  );

  const displayName =
    data.profile?.user?.name ?? user?.name ?? "Your Analytics";
  const displayEmail = data.profile?.user?.email ?? user?.email ?? "";

  const maxViews = data.topPosts[0]?.views ?? 0;

  // Ticks to show on the x-axis (every Nth label to avoid crowding)
  const tickStep = data.postsByDay.length > 14 ? Math.ceil(data.postsByDay.length / 8) : 1;

  if (isAuthLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 4 }} />
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, md: 2 }}>
                <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="main"
        sx={{ bgcolor: "#fffaf5", minHeight: "100vh", py: { xs: 0, sm: 4 } }}
      >
        <Container maxWidth="lg">
          {/* Hero */}
          <HeroSection
            name={displayName}
            email={displayEmail}
            avatarSrc={avatarSrc}
            isVerified={data.profile?.isVerified}
            joinedDaysAgo={data.joinedDaysAgo}
            isLoading={data.isLoading}
          />

          {/* Error */}
          {data.error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {data.error}
            </Alert>
          )}

          {/* Empty state */}
          {!data.isLoading && !data.error && data.totalPosts === 0 && (
            <EmptyState />
          )}

          {/* Content */}
          {(!data.isLoading || data.blogs.length > 0) && !data.error && data.totalPosts > 0 && (
            <>
              {/* ── KPIs row 1: Posts & Likes ── */}
              <SectionHeader title="Overview" />
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Total Posts"
                    value={data.totalPosts}
                    icon={ArticleIcon}
                    tooltip="All posts across every status"
                    accentColor="#b91c1c"
                    isLoading={data.isLoading}
                    animationDelay={0}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Published"
                    value={data.publishedPosts}
                    icon={PublicIcon}
                    tooltip="Live posts visible to readers"
                    accentColor="#dc2626"
                    isLoading={data.isLoading}
                    animationDelay={80}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Total Likes"
                    value={data.totalLikes}
                    icon={FavoriteIcon}
                    tooltip="Sum of likes across all posts"
                    accentColor="#ef4444"
                    isLoading={data.isLoading}
                    animationDelay={160}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Avg Likes / Post"
                    value={data.avgLikesPerPost}
                    icon={TrendingUpIcon}
                    tooltip="Average likes per published post"
                    accentColor="#f87171"
                    isLoading={data.isLoading}
                    animationDelay={240}
                  />
                </Grid>
              </Grid>

              {/* ── KPIs row 2: Views ── */}
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Total Views"
                    value={data.totalViews}
                    icon={VisibilityIcon}
                    tooltip="Total views across all published posts"
                    accentColor="#991b1b"
                    isLoading={data.isLoading}
                    animationDelay={320}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <KpiCard
                    label="Avg Views / Post"
                    value={data.avgViewsPerPost}
                    icon={TrendingUpIcon}
                    tooltip="Average views per published post"
                    accentColor="#dc2626"
                    isLoading={data.isLoading}
                    animationDelay={400}
                  />
                </Grid>
                {data.savedByOthers > 0 && (
                  <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <KpiCard
                      label="Blogs Saved"
                      value={data.savedByOthers}
                      icon={BookmarkIcon}
                      tooltip="Times readers saved your posts"
                      accentColor="#f87171"
                      isLoading={data.isLoading}
                      animationDelay={480}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Range switcher */}
              <SectionHeader
                title="Activity Overview"
                action={<RangeSwitcher value={data.range} onChange={data.setRange} />}
              />

              {/* Charts row 1: Views+Likes line + Status pie */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Views & Likes over time */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <ChartCard
                    title="Views & Likes Over Time"
                    subtitle={`Last ${data.range === "7D" ? "7 days" : data.range === "30D" ? "30 days" : "90 days"}`}
                    isLoading={data.isLoading}
                    minHeight={260}
                  >
                    <ViewsLikesChart data={data.postsByDay} tickStep={tickStep} />
                  </ChartCard>
                </Grid>

                {/* Pie chart: status breakdown */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <ChartCard
                    title="Status Breakdown"
                    subtitle="All posts by status"
                    isLoading={data.isLoading}
                    minHeight={260}
                  >
                    {data.statusBreakdown.length === 0 ? (
                      <Box
                        sx={{
                          height: 260,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography color="text.secondary" variant="body2">
                          No data yet.
                        </Typography>
                      </Box>
                    ) : (
                      <PieChart
                        series={[
                          {
                            data: data.statusBreakdown.map((s, i) => ({
                              id: i,
                              value: s.value,
                              label: s.label,
                              color: s.color,
                            })),
                            innerRadius: 55,
                            outerRadius: 70,
                            paddingAngle: 3,
                            cornerRadius: 4,
                            highlightScope: {
                              highlight: "item",
                              fade: "global",
                            },
                          },
                        ]}
                        height={260}
                        slotProps={{
                          legend: {
                            position: { vertical: "bottom", horizontal: "center" },
                          },
                        }}
                      />
                    )}
                  </ChartCard>
                </Grid>
              </Grid>

              {/* Charts row 2: Posts published + Top Tags */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Line chart: posts over time */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard
                    title="Posts Published Over Time"
                    subtitle={`Last ${data.range === "7D" ? "7 days" : data.range === "30D" ? "30 days" : "90 days"}`}
                    isLoading={data.isLoading}
                    minHeight={240}
                  >
                    {data.postsByDay.every((d) => d.count === 0) ? (
                      <Box
                        sx={{
                          height: 240,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography color="text.secondary" variant="body2">
                          No posts in this period.
                        </Typography>
                      </Box>
                    ) : (
                      <LineChart
                        xAxis={[
                          {
                            data: data.postsByDay.map((d) => d.date),
                            scaleType: "band",
                            tickMinStep: tickStep,
                            valueFormatter: (v: string) => v,
                          },
                        ]}
                        series={[
                          {
                            data: data.postsByDay.map((d) => d.count),
                            label: "Posts",
                            color: "#e63946",
                            area: true,
                            showMark: false,
                          },
                        ]}
                        height={240}
                        sx={{
                          ".MuiLineElement-root": { strokeWidth: 2.5 },
                          ".MuiAreaElement-root": { fillOpacity: 0.12 },
                        }}
                        slotProps={{ legend: {} }}
                      />
                    )}
                  </ChartCard>
                </Grid>

                {/* Bar chart: top tags */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard
                    title="Top Tags"
                    subtitle="By frequency across all posts"
                    isLoading={data.isLoading}
                    minHeight={240}
                  >
                    {data.tagFrequency.length === 0 ? (
                      <Box
                        sx={{
                          height: 240,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <BookmarkIcon sx={{ fontSize: 40, color: "#eadfd6" }} />
                        <Typography color="text.secondary" variant="body2">
                          Add tags to your posts to see this chart.
                        </Typography>
                      </Box>
                    ) : (
                      <BarChart
                        layout="horizontal"
                        xAxis={[{ scaleType: "linear" }]}
                        yAxis={[
                          {
                            data: data.tagFrequency.map((t) => t.tag),
                            scaleType: "band",
                          },
                        ]}
                        series={[
                          {
                            data: data.tagFrequency.map((t) => t.count),
                            label: "Posts",
                            color: "#457b9d",
                          },
                        ]}
                        height={240}
                        borderRadius={6}
                        slotProps={{ legend: {} }}
                      />
                    )}
                  </ChartCard>
                </Grid>
              </Grid>

              {/* Views bar chart full-width */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                  <ChartCard
                    title="Views Per Day"
                    subtitle={`Reader traffic in the last ${data.range}`}
                    isLoading={data.isLoading}
                    minHeight={220}
                  >
                    {data.postsByDay.every((d) => d.views === 0) ? (
                      <Box
                        sx={{
                          height: 220,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 40, color: "#eadfd6" }} />
                        <Typography color="text.secondary" variant="body2">
                          No views recorded in this period yet.
                        </Typography>
                      </Box>
                    ) : (
                      <BarChart
                        xAxis={[
                          {
                            data: data.postsByDay.map((d) => d.date),
                            scaleType: "band",
                            tickMinStep: tickStep,
                          },
                        ]}
                        series={[
                          {
                            data: data.postsByDay.map((d) => d.views),
                            label: "Views",
                            color: "#2a9d8f",
                          },
                        ]}
                        height={220}
                        borderRadius={6}
                        slotProps={{ legend: {} }}
                      />
                    )}
                  </ChartCard>
                </Grid>
              </Grid>

              {/* Top posts by views */}
              <SectionHeader title="Top Posts by Views" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                  <ChartCard
                    title="Top Posts by Views"
                    subtitle="Your most-read content"
                    isLoading={data.isLoading}
                    minHeight={200}
                  >
                    <TopPostsList
                      posts={data.topPosts}
                      maxViews={maxViews}
                      isLoading={data.isLoading}
                    />
                  </ChartCard>
                </Grid>
              </Grid>
            </>
          )}

          {/* Loading skeleton for charts */}
          {data.isLoading && (
            <>
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 6, md: 3 }}>
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 6, md: 3 }}>
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
                </Grid>
              </Grid>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
