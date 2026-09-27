"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../../../components/ui/Button";
import Footer from "../../../../components/footer/Footer";
import Navbar from "../../../../components/navbar/Navbar";
import { useAuth } from "../../../../context/AuthContext";
import { profileApi, ProfileData } from "../../../../lib/profile";

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
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
    profileApi
      .get()
      .then((response) => {
        if (cancelled) return;
        const nextProfile = response.profile ?? null;
        setProfile(nextProfile);
        setBio(nextProfile?.bio ?? "");
        setInstagram(nextProfile?.socialLinks?.instagram ?? "");
        setFacebook(nextProfile?.socialLinks?.facebook ?? "");
        setWebsite(nextProfile?.socialLinks?.website ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your profile.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData();
    formData.append("bio", bio.trim());
    formData.append("socialLinks[instagram]", instagram.trim());
    formData.append("socialLinks[facebook]", facebook.trim());
    formData.append("socialLinks[website]", website.trim());
    if (avatar) formData.append("avatar", avatar);

    try {
      await profileApi.update(formData);
      router.push("/profile");
    } catch {
      setError(
        "Unable to save your profile. Please check your details and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading || (!isAuthenticated && !error)) {
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/profile"
            className="text-sm font-semibold no-underline hover:underline"
          >
            &lt;- Back to profile
          </Link>
          <p className="eyebrow mt-8">Profile settings</p>
          <h1 className="mt-2 text-3xl">Edit Profile</h1>
          <p className="mt-3">Keep your profile details up to date.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold text-foreground">Account</p>
            <p className="mt-2 text-sm">{profile?.user?.name ?? user?.name}</p>
            <p className="text-sm">{profile?.user?.email ?? user?.email}</p>
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
              Avatar
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
              className="w-full px-3 py-3"
            />
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
              href="/profile"
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
      <Footer />
    </div>
  );
}
