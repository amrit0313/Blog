"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Card, Chip, Stack } from "@mui/material";
import Button from "./ui/Button";
import type { Blog } from "../lib/blog";
import { Category } from "../lib/category";

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
  isAuthLoading: boolean;
  onStartWriting: () => void;
  categories: Category[];
}

export default function HomepageSections({
  blogs,
  isAuthLoading,
  categories,
  onStartWriting,
}: HomepageSectionsProps) {
  return (
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
          Read the latest <span className="arrow ml-1 inline-block">-&gt;</span>
        </Link>
      </Reveal>
      <div className="grid auto-rows-112 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((post, index) => (
          <Reveal key={post._id} delay={index * 70} className="h-full">
            <Card
              component={Link}
              href="/blogs"
              elevation={0}
              className="post-card card group flex h-full flex-col overflow-hidden no-underline"
              sx={{
                color: "inherit",
                textDecoration: "none",
                transition: "transform 220ms ease, box-shadow 220ms ease",
              }}
            >
              <div className="post-cover flex h-44 items-end bg-linear-to-br p-5">
                <Chip
                  label={post.category?.title ?? "General"}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    color: "#16213e",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-6 text-xl leading-snug transition-colors group-hover:text-primary">
                  {post.description}
                </h3>
                <div className="mt-auto flex items-center justify-between pt-5 text-sm text-muted-foreground">
                  <span>{post.author?.name ?? "Anonymous"}</span>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-28">
        <p className="eyebrow mb-3">Find your next rabbit hole</p>
        <h2 className="text-3xl sm:text-4xl">Explore by topic</h2>
        <Stack
          direction="row"
          useFlexGap
          spacing={1.5}
          sx={{ mt: 3.5, flexWrap: "wrap" }}
        >
          {categories?.map((topic:Category) => (
            <Chip
              key={topic._id}
              component={Link}
              href="/blogs"
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
      </Reveal>

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
                Bring your point of view to a community that is ready to listen.
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
  );
}
