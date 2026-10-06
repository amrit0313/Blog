"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Chip, Stack } from "@mui/material";
import type { Blog } from "../lib/blog";
import { Category } from "../lib/category";
import { imgSrc } from "../utils/getImgSrc";
import styles from "./FeaturedSection.module.css";

const getDescriptionPreview = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add(styles.visible);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.section} mt-28`}>
      {children}
    </div>
  );
}

interface FeaturedSectionProps {
  categories: Category[];
  featuredBlog?: Blog;
  isBlogsLoading: boolean;
}

export default function FeaturedSection({
  categories,
  featuredBlog,
  isBlogsLoading,
}: FeaturedSectionProps) {
  return (
    <Reveal>
      <p className="eyebrow mb-3">Find your next rabbit hole</p>
      <h2 className="text-3xl sm:text-4xl">Explore by topic</h2>
      <Stack
        direction="row"
        useFlexGap
        spacing={1.5}
        sx={{ mt: 3.5, flexWrap: "wrap" }}
      >
        {categories?.map((topic: Category) => (
          <Chip
            key={topic._id}
            component={Link}
            href={`/blogs?category=${topic.title}`}
            clickable
            label={topic.title}
            className="topic-chip"
            sx={{
              height: 42,
              borderRadius: 999,
              backgroundColor: "white",
              border: "1px solid var(--border)",
              fontWeight: 600,
              "&:hover": {
                borderColor: "var(--primary)",
                color: "var(--primary)",
                backgroundColor: "var(--secondary)",
              },
            }}
          />
        ))}
      </Stack>
      <Stack spacing={2} sx={{ mt: 5 }}>
        {isBlogsLoading ? (
          <div
            aria-hidden="true"
            className="grid overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-[0.95fr_1.05fr]"
          >
            <div className="aspect-[16/10] animate-pulse bg-muted md:aspect-auto" />
            <div className="space-y-5 p-6 sm:p-8">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : featuredBlog ? (
          <Link
            href={`/blogs/${featuredBlog.slug}`}
            className={`${styles.card} group grid overflow-hidden rounded-2xl border border-border bg-background no-underline transition-all duration-300 hover:-translate-y-1 md:grid-cols-[0.95fr_1.05fr]`}
          >
            <div className={`${styles.media} ${styles.animate} relative aspect-[16/10] overflow-hidden bg-muted md:aspect-auto md:min-h-[360px]`}>
              {featuredBlog.image ? (
                <img
                  src={imgSrc(featuredBlog.image, "blogs")}
                  alt={featuredBlog.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    target.parentElement?.classList.add("blog-card-fallback");
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-transparent" />
              <span className={`${styles.eyebrow} ${styles.animate} absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur`}>
                Featured story
              </span>
            </div>
            <div className={`${styles.content} flex flex-col justify-center p-7 sm:p-10 lg:p-14`}>
              <div className={`${styles.animate} flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
                {featuredBlog.category?.title && (
                  <span className="text-primary">{featuredBlog.category.title}</span>
                )}
                <span>
                  {new Date(featuredBlog.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className={`${styles.title} ${styles.animate} mt-4 line-clamp-3 transition-colors duration-300 group-hover:text-primary`}>
                {featuredBlog.title}
              </h3>
              <p className={`${styles.description} ${styles.animate} mt-5 line-clamp-16`}>
                {getDescriptionPreview(featuredBlog.description)}
              </p>
              <div className={`${styles.animate} mt-8 flex items-center justify-between gap-4`}>
                <span className="text-sm font-semibold text-foreground">
                  By {featuredBlog.author?.name ?? "Anonymous"}
                </span>
                <span className={`${styles.cta} inline-flex shrink-0 items-center rounded-lg px-4 py-2.5 text-sm font-bold text-primary-foreground`}>
                  Read story
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-10 text-center">
            <p className="font-semibold text-foreground">Featured stories are coming soon.</p>
            <p className="mt-2 text-sm">
              Check back shortly for the community&apos;s latest highlight.
            </p>
          </div>
        )}
      </Stack>
    </Reveal>
  );
}
