"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { FaCheckCircle, FaFacebookF, FaGlobe, FaInstagram } from "react-icons/fa";
import Avatar from "../../../../components/avatar";
import BlogFeedCard from "../../../../components/BlogFeedCard";
import { useAuth } from "../../../../context/AuthContext";
import { ApiError } from "../../../../lib/api";
import { blogApi, type Blog } from "../../../../lib/blog";
import { profileApi, type ProfileData } from "../../../../lib/profile";

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

export default function AuthorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => setAuthorId(id));
  }, [params]);

  useEffect(() => {
    if (isAuthLoading || !authorId) return;

    // If the author is the logged-in user, redirect to their profile
    if (user && user.id === authorId) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;

    async function loadAuthorData() {
      try {
        const [profileRes, blogsRes] = await Promise.all([
          profileApi.getPublic(authorId!),
          blogApi.getByAuthor(authorId!, { limit: 50 }),
        ]);

        if (!cancelled) {
          startTransition(() => {
            setProfile(profileRes.profile ?? null);
            setBlogs(blogsRes.result ?? []);
          });
        }
      } catch (err) {
        if (!cancelled) {
          startTransition(() => {
            if (err instanceof ApiError && err.status === 404) {
              setError("Author not found.");
            } else {
              setError("Unable to load this author's profile.");
            }
          });
        }
      } finally {
        if (!cancelled) startTransition(() => setLoading(false));
      }
    }

    void loadAuthorData();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, authorId, user, router]);

  if (isAuthLoading || !authorId) {
    return (
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
        <p>Loading author profile...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
        <p>Loading author profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
        <p role="alert" className="text-center text-muted-foreground">
          {error}
        </p>
      </main>
    );
  }

  const authorUser = profile?.user;
  const displayName = authorUser?.name ?? "Author";
  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks).filter(([, value]) => Boolean(value))
    : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="space-y-6 lg:sticky lg:top-8">
            <section className="card flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex items-center gap-5">
                <Avatar
                  src={profile?.avatar}
                  name={displayName}
                  className="h-20 w-20 text-2xl"
                  fallback="initials"
                />
                <div>
                  <p className="eyebrow">Author</p>
                  <h1 className="mt-1 text-2xl">{displayName}</h1>
                  {authorUser?.email && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {authorUser.email}
                    </p>
                  )}
                  {profile?.isVerified && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <FaCheckCircle aria-hidden="true" /> Verified account
                    </p>
                  )}
                </div>
              </div>

              {(profile?.bio || socialLinks.length > 0) && (
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
            </section>
          </div>

          {/* ── Right column: Published Blogs ── */}
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className=" text-2xl">Published Blogs</h2>
              </div>
            </div>

            {blogs.length === 0 ? (
              <p className="mt-6 text-muted-foreground">
                No published blogs yet.
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                {blogs.map((blog) => (
                  <BlogFeedCard key={blog._id} blog={blog} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}