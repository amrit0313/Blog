"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HiArrowLeft,
  HiCheckBadge,
  HiChevronRight,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

import Avatar from "../../../components/avatar";
import SearchBox from "../../../components/ui/search-box";
import Highlight from "../../../utils/highlighter";
import {
  searchApi,
  type SearchBlog,
  type SearchUser,
} from "../../../lib/search";

type Status = "idle" | "loading" | "done" | "error";

function Hint({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}

function UserRow({ user, query }: { user: SearchUser; query: string }) {
  return (
    <Link
      href={`/authors/${user._id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary"
    >
      <Avatar
        src={user.avatar}
        name={user.name}
        className="h-11 w-11 shrink-0 text-sm"
        fallback="initials"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        <Highlight text={user.name} query={query} />
      </span>
      {user.isVerified && (
        <HiCheckBadge className="h-4 w-4 shrink-0 text-primary" />
      )}
      <HiChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function BlogRow({ blog, query }: { blog: SearchBlog; query: string }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <h3 className="line-clamp-2 text-base font-semibold text-foreground">
        <Highlight text={blog.title} query={query} />
      </h3>
      {blog.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          <Highlight text={blog.excerpt} query={query} />
        </p>
      )}
      <p className="mt-2 truncate text-xs text-muted-foreground">
        By {blog.author?.name ?? "Unknown"}
        {blog.category?.title ? `  ·  ${blog.category.title}` : ""}
      </p>
    </Link>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [blogs, setBlogs] = useState<SearchBlog[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (q.length < 2) {
      setUsers([]);
      setBlogs([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    searchApi
      .search(q)
      .then((res) => {
        if (cancelled) return;
        setUsers(res.result.users ?? []);
        setBlogs(res.result.blogs ?? []);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  // replace (not push) so every keystroke doesn't add a history entry
  const handleSearch = useCallback(
    (value: string) => {
      router.replace(
        value ? `/search?q=${encodeURIComponent(value)}` : "/search",
      );
    },
    [router],
  );

  const hasResults = users.length > 0 || blogs.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/blogs"
            aria-label="Back to blogs"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <SearchBox
            autoFocus
            initialValue={q}
            onSearch={handleSearch}
            placeholder="Search blogs and people"
            className="sm:w-full"
          />
        </div>

        <div className="mt-6 space-y-6">
          {status === "idle" && (
            <Hint
              icon={<HiOutlineMagnifyingGlass className="h-9 w-9" />}
              title="Search"
              message="Find blogs by title, topic or tag, and people by name."
            />
          )}

          {status === "loading" && <ResultsSkeleton />}

          {status === "error" && (
            <Hint
              icon={<HiOutlineExclamationCircle className="h-9 w-9" />}
              title="Search failed"
              message="Check your connection and try again."
            />
          )}

          {status === "done" && !hasResults && (
            <Hint
              icon={<HiOutlineDocumentText className="h-9 w-9" />}
              title="No results"
              message={`Nothing found for "${q}".`}
            />
          )}

          {status === "done" && users.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">People</h2>
              {users.map((user) => (
                <UserRow key={user._id} user={user} query={q} />
              ))}
            </section>
          )}

          {status === "done" && blogs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Blogs</h2>
              {blogs.map((blog) => (
                <BlogRow key={blog._id} blog={blog} query={q} />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}