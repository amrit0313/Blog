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
import ProfileBlogCard from "../../../components/ProfileBlogCard";

import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import { blogApi, type Blog } from "../../../lib/blog";
import { profileApi, ProfileData } from "../../../lib/profile";
import { toast } from "sonner";

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
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [blogsError, setBlogsError] = useState("");
  const [statusFilter, setStatusFilter] = useState("published");

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
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
        <p>Loading your profile...</p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const profileUser = profile?.user ?? user;
  const displayName = profileUser?.name ?? "Your profile";
  const publishedBlogs = blogs.filter((blog) => blog.status === "published");
  const drafts = blogs.filter((blog) => blog.status === "draft");
  const savedBlogs = (profile?.savedBlogs ?? []).filter(Boolean);
  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks).filter(([, value]) => Boolean(value))
    : [];

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await blogApi.delete(blogId);
      setBlogs((prev) => prev.filter((b) => b._id !== blogId));
      toast.success("Blog deleted successfully");
    } catch {
      toast.error("Failed to delete blog. Please try again.");
    }
  };

  const handleUnpublishBlog = async (blogId: string) => {
    if (!window.confirm("Are you sure you want to unpublish this blog?")) return;
    try {
      await blogApi.unpublish(blogId);
      setBlogs((prev) =>
        prev.map((b) => (b._id === blogId ? { ...b, status: "unpublished" } : b))
      );
      toast.success("Blog unpublished successfully");
    } catch {
      toast.error("Failed to unpublish blog. Please try again.");
    }
  };

  const filteredBlogs = blogs.filter((blog) => blog.status === statusFilter);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
          {/* ── Left column: profile + drafts ── */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <section className="card flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-5">
                  <Avatar src={profile?.avatar} className="h-20 w-20 text-2xl" />
                  <div>
                    <p className="eyebrow">Profile</p>
                    <h1 className="mt-1 text-2xl">{displayName}</h1>
                    <p className="mt-1 text-sm">{profileUser?.email}</p>
                    {profile?.isVerified && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <FaCheckCircle aria-hidden="true" /> Verified account
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    href="/profile/edit"
                    variant="outline"
                    className="w-full rounded-md px-4 py-2 no-underline"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    href="/profile/analytics"
                    variant="outline"
                    className="w-full rounded-md px-4 py-2 no-underline">
                    Analytics
                  </Button>
                </div>
              </div>

              {profileMissing ? (
                <div className="rounded-md bg-muted p-5">
                  <h2 className="text-lg">Complete your profile</h2>
                  <p className="mt-2 leading-7">
                    Add a bio, website, and other details to tell people more
                    about you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 border-t pt-5">
                  {profile?.bio && (
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        About
                      </p>
                      <p className="leading-7">{profile.bio}</p>
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

              {profileLoading && (
                <p className="text-sm">Loading profile details...</p>
              )}
              {profileError && (
                <p
                  role="alert"
                  className="rounded-md border border-primary/30 bg-secondary px-4 py-3 text-sm text-secondary-foreground"
                >
                  {profileError}
                </p>
              )}
            </section>

            {!blogsLoading && !blogsError && (
              <Link
                href="/profile/drafts"
                className="card flex items-center justify-between gap-4 p-6 no-underline transition-colors hover:border-primary"
              >
                <div>
                  <p className="eyebrow">Private</p>
                  <h3 className="mt-2 text-xl">Drafts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {drafts.length === 0
                      ? "Your unfinished blogs will appear here."
                      : `${drafts.length} unpublished ${drafts.length === 1 ? "blog" : "blogs"} waiting for you.`}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-primary">
                  &rarr;
                </span>
              </Link>
            )}

            {!profileLoading && (
              <Link
                href="/profile/saved"
                className="card flex items-center justify-between gap-4 p-6 no-underline transition-colors hover:border-primary"
              >
                <div>
                  <p className="eyebrow">Private</p>
                  <h3 className="mt-2 text-xl">Saved Blogs</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {savedBlogs.length === 0
                      ? "Blogs you save for later will appear here."
                      : `${savedBlogs.length} saved ${savedBlogs.length === 1 ? "blog" : "blogs"} to read later.`}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-primary">
                  &rarr;
                </span>
              </Link>
            )}




            {!blogsLoading && !blogsError && publishedBlogs.length > 0 && (
              <Button
                href="/blogs/create"
                className="w-full rounded-md px-4 py-2 no-underline"
              >
                Start Writing
              </Button>
            )}
          </div>

          <section>
            {!blogsLoading && !blogsError && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl">Your Blogs</h2>

                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="submitted">Submitted for Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {!blogsLoading && !blogsError && (
              filteredBlogs.length === 0 ? (
                <p className="mt-6 text-muted-foreground">
                  No {statusFilter} blogs.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  {filteredBlogs.map((blog) => (
                    <ProfileBlogCard
                      key={blog._id}
                      blog={blog}
                      onDelete={handleDeleteBlog}
                      onUnpublish={
                        blog.status === "published"
                          ? handleUnpublishBlog
                          : undefined
                      }
                    />
                  ))}
                </div>
              )
            )}

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
              <div className="card mt-6 flex flex-col items-center gap-4 p-8 text-center sm:p-10">
                <h3 className="text-2xl">No blogs yet</h3>
                <p className="mx-auto mt-3 max-w-md leading-7">
                  Start writing a blog when you are ready to share your ideas
                  with the community.
                </p>
                <Button
                  href="/blogs/create"
                  className="mt-6 w-40 rounded-md px-5 py-3 no-underline"
                >
                  Start Writing
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
