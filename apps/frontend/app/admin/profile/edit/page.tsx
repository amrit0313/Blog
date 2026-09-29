// app/admin/profile/edit/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../../../components/ui/Button";
import { useAuth } from "../../../../context/AuthContext";
import { profileApi, ProfileData } from "../../../../lib/profile";
import { getErrorMessage } from "../../../../lib/toast";
import { toast } from "sonner";

export default function AdminEditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
   const profile = profileApi
      .get()
      .then((response) => {
        if (cancelled) return;
        const nextProfile = response.profile ?? null;
        setProfile(nextProfile);
        setName(nextProfile?.user?.name ?? user?.name ?? "");
        setEmail(nextProfile?.user?.email ?? user?.email ?? "");
        setBio(nextProfile?.bio ?? "");
        setInstagram(nextProfile?.socialLinks?.instagram ?? "");
        setFacebook(nextProfile?.socialLinks?.facebook ?? "");
        setWebsite(nextProfile?.socialLinks?.website ?? "");
        setAvatarPreview(nextProfile?.avatar ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your profile.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
console.log(profile)
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("bio", bio.trim());
    formData.append("socialLinks[instagram]", instagram.trim());
    formData.append("socialLinks[facebook]", facebook.trim());
    formData.append("socialLinks[website]", website.trim());
    if (avatar) formData.append("avatar", avatar);

    try {
      const response = await profileApi.update(formData);
      toast.success(response.message ?? "Profile updated successfully.");
      router.push("/admin/profile");
    } catch (submitError) {
      toast.error(
        getErrorMessage(submitError, "Unable to update your profile."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading || (!isAuthenticated && !error)) {
    return (
      <>
        <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-16">
          <p>Loading your profile...</p>
        </main>
      </>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-full flex-1 flex-col">

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/admin/profile"
            className="text-sm font-semibold no-underline hover:underline"
          >
            &lt;- Back to profile
          </Link>
          <p className="eyebrow mt-8">Admin settings</p>
          <h1 className="mt-2 text-3xl">Edit Profile</h1>
          <p className="mt-3">Keep your profile details up to date.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold text-foreground">Account</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-3 py-3"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-3 py-3"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={250}
              rows={4}
              className="w-full px-3 py-3"
              placeholder="Tell the community a little about yourself"
            />
          </div>

          <div>
            <label
              htmlFor="avatar"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Profile Image
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
              className="w-full px-3 py-3"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a new profile image
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="instagram"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Instagram URL
              </label>
              <input
                id="instagram"
                type="url"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                className="w-full px-3 py-3"
              />
            </div>
            <div>
              <label
                htmlFor="facebook"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Facebook URL
              </label>
              <input
                id="facebook"
                type="url"
                value={facebook}
                onChange={(event) => setFacebook(event.target.value)}
                className="w-full px-3 py-3"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="website"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Website URL
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="w-full px-3 py-3"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-primary/30 bg-secondary px-3 py-2 text-sm text-secondary-foreground"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              href="/admin/profile"
              className="rounded-md px-4 py-2 no-underline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSaving}
              className="rounded-md px-5 py-3 font-semibold"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
