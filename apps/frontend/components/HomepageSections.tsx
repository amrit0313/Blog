"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Button from "./ui/Button";
import type { Blog } from "../lib/blog";
import { Category } from "../lib/category";
import { imgSrc } from "../utils/getImgSrc";
import FeaturedSection from "./FeaturedSection";

const getDescriptionPreview = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface HomepageSectionsProps {
  blogs: Blog[];
  isBlogsLoading: boolean;
  isAuthLoading: boolean;
  onStartWriting: () => void;
  categories: Category[];
}

export default function HomepageSections({
  blogs,
  isBlogsLoading,
  isAuthLoading,
  categories,
  onStartWriting,
}: HomepageSectionsProps) {
  const featuredBlog = blogs.find(
    (blog) => blog.category?.title?.toLowerCase() === "featured",
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .blog-card-fallback {
          background: linear-gradient(135deg, var(--muted) 0%, var(--border) 100%);
        }
      `}</style>
      <div className="mx-auto w-full max-w-6xl px-6 pb-20 lg:px-8">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Fresh from the community</p>
            <h2 className="text-3xl sm:text-4xl">Latest stories</h2>
          </div>
          <Link
            href="/blogs"
            className="hidden font-semibold no-underline sm:block"
          >
            Read the latest{" "}
            <span className="arrow ml-1 inline-block">-&gt;</span>
          </Link>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isBlogsLoading
            ? Array.from({ length: 6 }, (_, index) => (
                <div
                  key={`latest-story-skeleton-${index}`}
                  aria-hidden="true"
                  className="h-full overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="aspect-[16/10] animate-pulse bg-muted" />
                  <div className="space-y-4 p-5">
                    <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="flex justify-between pt-4">
                      <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            : blogs.map((post, index) => (
                <Reveal key={post._id} delay={index * 70} className="h-full">
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background no-underline motion-safe:animate-[fadeUp_400ms_ease-out_both] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
                    style={{
                      animationDelay: `${index * 80}ms`,
                    }}
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-muted">
                      {post.image ? (
                        <img
                          src={imgSrc(post.image, "blogs")}
                          alt={post.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            target.parentElement?.classList.add(
                              "blog-card-fallback",
                            );
                          }}
                        />
                      ) : null}
                      {/* Gradient overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      {/* Category badge */}
                      {post.category?.title && (
                        <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          {post.category.title}
                        </span>
                      )}
                    </div>
                    {/* Body */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold line-clamp-2 text-lg leading-snug text-foreground transition-colors duration-300 group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {getDescriptionPreview(post.description)}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                        <span>{post.author?.name ?? "Anonymous"}</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                        Read more
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
        </div>

        <FeaturedSection
          categories={categories}
          featuredBlog={featuredBlog}
          isBlogsLoading={isBlogsLoading}
        />

        <Reveal className="mt-28">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Make something meaningful</p>
            <h2 className="text-3xl sm:text-4xl">How it works</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              "Create an account",
              "Write your story",
              "Share it with the community",
            ].map((step, index) => (
              <div key={step} className="border-t-2 border-primary pt-5">
                <span className="text-4xl font-bold text-primary/35">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-xl">{step}</h3>
                <p className="mt-2 leading-7">
                  Bring your point of view to a community that is ready to
                  listen.
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="cta-band bg-muted mt-28 overflow-hidden rounded-lg px-7 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-widest text-white/75">
            Your next chapter starts here
          </p>
          <h2 className="mt-3 text-3xl text-white sm:text-5xl">
            Your story deserves to be read
          </h2>
          <Button
            onClick={onStartWriting}
            disabled={isAuthLoading}
            className="mt-8 rounded-md bg-primary px-7 py-3 font-semibold text-primary no-underline hover:bg-white hover:text-red-500! hover:border hover:border-red-500!"
          >
            Start writing
          </Button>
        </Reveal>
      </div>
    </>
  );
}
