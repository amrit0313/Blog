"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../lib/profile";
import { toast } from "sonner";

interface SaveBlogButtonProps {
  blogId: string;
  className?: string;
}

export default function SaveBlogButton({
  blogId,
  className = "",
}: SaveBlogButtonProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = async () => {
    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      if (isSaved) {
        await profileApi.removeSavedBlog(blogId);
        setIsSaved(false);
        toast.success("Blog removed from saved blogs");
      } else {
        await profileApi.saveBlog(blogId);
        setIsSaved(true);
        toast.success("Blog saved for later");
      }
    } catch {
      toast.error("Unable to update your saved blogs. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={authLoading || isSaving}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove blog from saved blogs" : "Save blog for later"}
      title={isSaved ? "Remove from saved blogs" : "Save for later"}
      className={`inline-flex flex-1 items-center justify-center rounded-md py-2 transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      
      <svg
        aria-hidden="true"
        className={`h-5 w-5 transition-colors ${
          isSaved ? "fill-red-600 stroke-red-600" : "fill-white stroke-slate-600"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21l-5.75-3.5L5.75 21V4.75h1Z" />
      </svg>
    </button>
  );
}
