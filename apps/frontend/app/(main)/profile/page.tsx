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
          console.log(response);
        }
      } catch (error){
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
        <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
          <p>Loading your profile...</p>
        </main>
      </>
    );
  }

  if (!isAuthenticated) return null;

  const profileUser = profile?.user ?? user;
  const displayName = profileUser?.name ?? "Your profile";
  const publishedBlogs = blogs.filter((blog) => blog.status === "published");
  const drafts = blogs.filter((blog) => blog.status === "draft");
  const submittedBlogs = blogs.filter((blog) => blog.status === "submitted");
  const rejectedBlogs = blogs.filter((blog) => blog.status === "rejected");
  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks).filter(([, value]) => Boolean(value))
    : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
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
            {!blogsLoading && !blogsError && publishedBlogs.length > 0 && (
              <Button
                href="/blogs/create"
                className="rounded-md px-4 py-2 no-underline"
              >
                Start Writing
              </Button>
            )}
          </div>

          {!blogsLoading && !blogsError && (
            <Link
              href="/profile/drafts"
              className="card mt-6 flex items-center justify-between gap-4 p-6 no-underline transition-colors hover:border-primary"
            >
              <div>
                <p className="eyebrow">Private</p>
                <h3 className="mt-2 text-2xl">Drafts</h3>
                <p className="mt-2 text-muted-foreground">
                  {drafts.length === 0
                    ? "Your unfinished blogs will appear here."
                    : `${drafts.length} unpublished ${drafts.length === 1 ? "blog" : "blogs"} waiting for you.`}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-primary">
                Open drafts &rarr;
              </span>
            </Link>
          )}
          <h3 className="mt-8 text-xl font-bold">Published Blogs</h3>
          {!blogsLoading && !blogsError && publishedBlogs.length === 0 && (
            <p className="mt-3 text-muted-foreground">
              No published blogs yet.
            </p>
          )}
          {!blogsLoading && !blogsError && publishedBlogs.length > 0 && (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {publishedBlogs.map((blog) => (
                <ProfileBlogCard
                  key={blog._id}
                  blog={blog}
                  statusClassName="bg-green-100 text-green-700"
                />
              ))}
            </div>
          )}

          {/* Submitted for Review */}
          <h3 className="mt-10 text-xl font-bold">Submitted for review</h3>
          {!blogsLoading && !blogsError && submittedBlogs.length === 0 && (
            <p className="mt-3 text-muted-foreground">
              No blogs submitted for review.
            </p>
          )}
          {!blogsLoading && !blogsError && submittedBlogs.length > 0 && (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {submittedBlogs.map((blog) => (
                <ProfileBlogCard
                  key={blog._id}
                  blog={blog}
                  statusClassName="bg-yellow-100 text-yellow-700"
                />
              ))}
            </div>
          )}

          <h3 className="mt-10 text-xl font-bold">Rejected Blogs</h3>
          {!blogsLoading && !blogsError && rejectedBlogs.length === 0 && (
            <p className="mt-3 text-muted-foreground">No rejected blogs.</p>
          )}
          {!blogsLoading && !blogsError && rejectedBlogs.length > 0 && (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rejectedBlogs.map((blog) => (
                <ProfileBlogCard
                  key={blog._id}
                  blog={blog}
                  statusClassName="bg-red-100 text-red-700"
                />
              ))}
            </div>
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

          {!blogsLoading && !blogsError && publishedBlogs.length === 0 && (
            <div className="flex flex-col items-center gap-4 card mt-6 p-8 text-center sm:p-10">
              <h3 className="text-2xl">No published blogs yet</h3>
              <p className="mx-auto mt-3 max-w-md leading-7">
                Publish a blog when you are ready to share your ideas with the
                community.
              </p>
              <Button
                href="/blogs/create"
                className="mt-6 rounded-md px-5 py-3 no-underline w-40"
              >
                Start Writing
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
