"use client";

import { useEffect, useMemo, useState } from "react";
import { blogApi, type Blog } from "../../../../lib/blog";
import { profileApi, type ProfileData } from "../../../../lib/profile";

export type Range = "7D" | "30D" | "90D";

export interface PostPerDay {
  date: string; // "MMM D"
  count: number;
  likes: number;
  views: number;
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface StatusBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface TopPost {
  _id: string;
  title: string;
  slug: string;
  likes: number;
  views: number;
  status: Blog["status"];
  createdAt: string;
}

export interface AnalyticsData {
  profile: ProfileData | null;
  blogs: Blog[];
  range: Range;
  setRange: (r: Range) => void;
  // KPIs
  totalPosts: number;
  publishedPosts: number;
  totalLikes: number;
  totalViews: number;
  savedByOthers: number;
  joinedDaysAgo: number;
  avgLikesPerPost: number;
  avgViewsPerPost: number;
  // Chart data
  postsByDay: PostPerDay[];
  tagFrequency: TagFrequency[];
  statusBreakdown: StatusBreakdown[];
  topPosts: TopPost[];
  // State
  isLoading: boolean;
  error: string | null;
}

const STATUS_COLORS: Record<Blog["status"], string> = {
  featured: "#b91c1c",     // highlighted published post
  published: "#dc2626",    // strongest red
  rejected: "#b91c1c",     // deep, darker red
  submitted: "#ef4444",    // medium red
  draft: "#f87171",        // lighter red
  unpublished: "#fca5a5",  // faintest, most muted
};
const RANGE_DAYS: Record<Range, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function subtractDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useAnalyticsData(): AnalyticsData {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("30D");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([blogApi.myBlogs(), profileApi.get()])
      .then(([blogsRes, profileRes]) => {
        if (cancelled) return;
        setBlogs(blogsRes.result ?? []);
        setProfile(profileRes.profile ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load analytics data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPosts = blogs.length;

  const publishedPosts = useMemo(
    () =>
      blogs.filter(
        (b) => b.status === "published" || b.status === "featured",
      ).length,
    [blogs],
  );

  const totalLikes = useMemo(
    () => blogs.reduce((sum, b) => sum + (b.likes?.length ?? 0), 0),
    [blogs],
  );

  const totalViews = useMemo(
    () => blogs.reduce((sum, b) => sum + (b.views ?? 0), 0),
    [blogs],
  );

  const avgLikesPerPost =
    publishedPosts > 0
      ? Math.round((totalLikes / publishedPosts) * 10) / 10
      : 0;

  const avgViewsPerPost =
    publishedPosts > 0
      ? Math.round((totalViews / publishedPosts) * 10) / 10
      : 0;

  const joinedDaysAgo = useMemo(() => {
    if (!profile?.createdAt) return 0;
    const joined = new Date(profile.createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [profile?.createdAt]);

  const savedByOthers = profile?.savedBlogs?.length ?? 0;

  const postsByDay = useMemo<PostPerDay[]>(() => {
    const days = RANGE_DAYS[range];
    const cutoff = subtractDays(days);
    const map = new Map<string, { count: number; likes: number; views: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = subtractDays(i);
      const key = formatDay(d);
      if (!map.has(key)) map.set(key, { count: 0, likes: 0, views: 0 });
    }

    blogs.forEach((blog) => {
      const created = new Date(blog.createdAt);
      if (created < cutoff) return;
      const key = formatDay(created);
      const entry = map.get(key) ?? { count: 0, likes: 0, views: 0 };
      entry.count += 1;
      entry.likes += blog.likes?.length ?? 0;
      entry.views += blog.views ?? 0;
      map.set(key, entry);
    });

    return Array.from(map.entries()).map(([date, { count, likes, views }]) => ({
      date,
      count,
      likes,
      views,
    }));
  }, [blogs, range]);

  const tagFrequency = useMemo<TagFrequency[]>(() => {
    const freq = new Map<string, number>();
    blogs.forEach((blog) => {
      (blog.tags ?? []).forEach((tag) => {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(freq.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [blogs]);

  const statusBreakdown = useMemo<StatusBreakdown[]>(() => {
    const counts: Partial<Record<Blog["status"], number>> = {};
    blogs.forEach((b) => {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    });
    const labels: Record<Blog["status"], string> = {
      featured: "Featured",
      published: "Published",
      draft: "Draft",
      unpublished: "Unpublished",
      submitted: "Submitted",
      rejected: "Rejected",
    };
    return (Object.keys(counts) as Blog["status"][])
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({
        label: labels[s],
        value: counts[s]!,
        color: STATUS_COLORS[s],
      }));
  }, [blogs]);

  const topPosts = useMemo<TopPost[]>(
    () =>
      [...blogs]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5)
        .map((b) => ({
          _id: b._id,
          title: b.title,
          slug: b.slug,
          likes: b.likes?.length ?? 0,
          views: b.views ?? 0,
          status: b.status,
          createdAt: b.createdAt,
        })),
    [blogs],
  );

  return {
    profile,
    blogs,
    range,
    setRange,
    totalPosts,
    publishedPosts,
    totalLikes,
    totalViews,
    savedByOthers,
    joinedDaysAgo,
    avgLikesPerPost,
    avgViewsPerPost,
    postsByDay,
    tagFrequency,
    statusBreakdown,
    topPosts,
    isLoading,
    error,
  };
}
