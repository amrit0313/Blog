"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
} from "react-icons/fa";
import Button from "../../../components/ui/Button";
import Avatar from "../../../components/avatar";
import Footer from "../../../components/footer/Footer";
import Navbar from "../../../components/navbar/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { blogApi, BlogSummary } from "../../../lib/blog";
import { profileApi, ProfileData } from "../../../lib/profile";

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function getExternalHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function getLinkLabel(value: string) {
  try {
    return new URL(getExternalHref(value)).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

const socialIcons = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  website: FaGlobe,
};

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [blogsError, setBlogsError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await profileApi.get();
        if (!cancelled) {
          startTransition(() => {
            setProfile(response.profile ?? null);
            setProfileMissing(!response.profile);
          });
        }
      } catch (error) {
        if (!cancelled) {
          startTransition(() => {
            if (
              error instanceof ApiError &&
              (error.status === 400 ||
                error.message.toLowerCase().includes("doesn't exist"))
            ) {
              setProfileMissing(true);
            } else {
              setProfileError("Unable to load your profile.");
            }
          });
        }
      } finally {
        if (!cancelled) startTransition(() => setProfileLoading(false));
      }
    }

    async function loadBlogs() {
      try {
        const response = await blogApi.myBlogs();
        if (!cancelled) {
          startTransition(() => setBlogs(response.result ?? []));
        }
      } catch {
        if (!cancelled) {
          startTransition(() =>
            setBlogsError("Your blogs are unavailable right now."),
          );
        }
      } finally {
        if (!cancelled) startTransition(() => setBlogsLoading(false));
      }
    }

    void Promise.all([loadProfile(), loadBlogs()]);

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || (!isAuthenticated && !profileError)) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
          <p>Loading your profile...</p>
        </main>
      </>
    );
  }

  if (!isAuthenticated) return null;

  const profileUser = profile?.user ?? user;
  const displayName = profileUser?.name ?? "Your profile";
  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks).filter(([, value]) => Boolean(value))
    : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
        <section className="card flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar
                src={profile?.avatar}
                name={displayName}
                className="h-20 w-20 text-2xl"
              />
              <div>
                <p className="eyebrow">Profile</p>
                <h1 className="mt-1 text-3xl">{displayName}</h1>
                <p className="mt-1">{profileUser?.email}</p>
                {profile?.isVerified && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <FaCheckCircle aria-hidden="true" /> Verified account
                  </p>
                )}
              </div>
            </div>
            <Button
              href="/profile/edit"
              variant="outline"
              className="rounded-md px-4 py-2 no-underline"
            >
              Edit Profile
            </Button>
          </div>

          {profileMissing ? (
            <div className="rounded-md bg-muted p-5">
              <h2 className="text-lg">Complete your profile</h2>
              <p className="mt-2 max-w-xl leading-7">
                Add a bio, website, and other details to tell people more about
                you.
              </p>
            </div>
          ) : (
            <div className="space-y-4 border-t pt-5">
              {profile?.bio && (
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    About
                  </p>
                  <p className="max-w-2xl leading-7">{profile.bio}</p>
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {socialLinks.map(([label, value]) => {
                    const Icon = socialIcons[label as keyof typeof socialIcons];
                    return (
                      <a
                        key={label}
                        href={getExternalHref(value as string)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex max-w-full items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold no-underline hover:border-primary hover:text-primary"
                      >
                        {Icon && <Icon aria-hidden="true" />}
                        <span className="truncate">
                          {getLinkLabel(value as string)}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {profileLoading && (
          <p className="mt-4 text-sm">Loading profile details...</p>
        )}
        {profileError && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-primary/30 bg-secondary px-4 py-3 text-secondary-foreground"
          >
            {profileError}
          </p>
        )}

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Writing</p>
              <h2 className="mt-2 text-3xl">Your Blogs</h2>
            </div>
            {!blogsLoading && !blogsError && blogs.length > 0 && (
              <Button
                href="/main/blogs/create"
                className="rounded-md px-4 py-2 no-underline"
              >
                Start Writing
              </Button>
            )}
          </div>

          {blogsLoading && <p className="mt-6">Loading your blogs...</p>}
          {blogsError && (
            <p
              role="alert"
              className="mt-6 rounded-md border border-primary/30 bg-secondary px-4 py-3 text-secondary-foreground"
            >
              {blogsError}
            </p>
          )}
          {!blogsLoading && !blogsError && blogs.length === 0 && (
            <div className="flex flex-col items-center gap-4 card mt-6 p-8 text-center sm:p-10">
              <h3 className="text-2xl">No blogs yet</h3>
              <p className="mx-auto mt-3 max-w-md leading-7">
                You haven&apos;t published any blogs yet. Start writing and
                share your ideas with the community.
              </p>
              <Button
                href="/main/blogs/create"
                className="mt-6 rounded-md px-5 py-3 no-underline w-40"
              >
                Start Writing
              </Button>
            </div>
          )}
          {!blogsLoading && !blogsError && blogs.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <article key={blog._id} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl leading-tight">{blog.title}</h3>
                    {blog.status && (
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {blog.status}
                      </span>
                    )}
                  </div>
                  {blog.category?.title && (
                    <p className="mt-3 text-sm text-primary">
                      {blog.category.title}
                    </p>
                  )}
                  {blog.description && (
                    <p className="mt-3 line-clamp-3 leading-6">
                      {blog.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-sm">
                    <span className="text-muted-foreground">
                      {formatDate(blog.updatedAt ?? blog.createdAt) ??
                        "Recently"}
                    </span>
                    <Link
                      href={`/main/blogs/${blog._id}`}
                      className="font-semibold no-underline hover:underline"
                    >
                      Read blog
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
