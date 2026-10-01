// app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaCheckCircle,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
} from "react-icons/fa";
import Button from "../../../../components/ui/Button";
import Avatar from "../../../../components/avatar";
import ProfileBlogCard from "../../../../components/ProfileBlogCard";
import { adminApi, type AdminUser, type AdminBlog } from "../../../../lib/admin";
import { profileApi, ProfileData } from "../../../../lib/profile";
import { ApiError } from "../../../../lib/api";
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

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setError("");
        const [userRes, profileRes, blogsRes] = await Promise.all([
          adminApi.getUser(id),
          profileApi.get().catch(() => null),
          adminApi.listAllBlogs({ limit: 100 }),
        ]);

        setUser(userRes.user);
        if (profileRes) setProfile(profileRes.profile ?? null);

        const allBlogs = "result" in blogsRes ? blogsRes.result : [];
        const userBlogs = allBlogs.filter(
          (b) => b.author?._id === id && b.status !== "draft"
        );
        setBlogs(userBlogs);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError("User not found.");
        } else {
          setError("Unable to load user details.");
        }
      } finally {
        setLoading(false);
        setBlogsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/admin/users")}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.name ?? "User";
  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks).filter(([, value]) => Boolean(value))
    : [];

  const filteredBlogs =
    statusFilter === "all"
      ? blogs
      : blogs.filter((b) => b.status === statusFilter);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push("/admin/users")}
      >
        &larr; Back to Users
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* ── Left column: profile ── */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <section className="card flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <Avatar name={displayName} className="h-20 w-20 text-2xl" />
                <div>
                  <p className="eyebrow">User Profile</p>
                  <h1 className="mt-1 text-2xl">{displayName}</h1>
                  <p className="mt-1 text-sm">{user.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    {user.role ?? "user"}
                  </span>
                </div>
              </div>
            </div>

            {profile?.bio && (
              <div className="space-y-4 border-t pt-5">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    About
                  </p>
                  <p className="leading-7">{profile.bio}</p>
                </div>
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

            {!profile?.bio && (
              <div className="rounded-md bg-muted p-5">
                <h2 className="text-lg">No profile details</h2>
                <p className="mt-2 leading-7">
                  This user has not added any profile information yet.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Right column: blogs ── */}
        <section>
          {!blogsLoading && !error && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl">Blogs by {displayName}</h2>

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
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="submitted">Submitted for Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          )}

          {blogsLoading && <p className="mt-6">Loading blogs...</p>}

          {!blogsLoading && blogs.length === 0 && (
            <p className="mt-6 text-muted-foreground">
              No blogs found for this user.
            </p>
          )}

          {!blogsLoading && blogs.length > 0 && (
            <>
              {filteredBlogs.length === 0 ? (
                <p className="mt-6 text-muted-foreground">
                  No {statusFilter} blogs.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  {filteredBlogs.map((blog) => (
                    <ProfileBlogCard
                      key={blog._id}
                      blog={blog}
                      actionHref={`/admin/blogs/${blog.slug}`}
                      actionLabel="View"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
