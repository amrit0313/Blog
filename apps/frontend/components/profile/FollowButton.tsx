"use client";

interface FollowButtonProps {
  isFollowing: boolean;
  pending?: boolean;
  onClick: () => void;
  /** Label when not following, e.g. "Follow" or "Follow back". */
  followLabel?: string;
  /** "sm" for list rows, "lg" for a full-width profile button. */
  size?: "sm" | "lg";
  className?: string;
}

/** Reusable in the modal rows and on public profile pages. */
export default function FollowButton({
  isFollowing,
  pending = false,
  onClick,
  followLabel = "Follow",
  size = "sm",
  className = "",
}: FollowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={isFollowing}
      className={[
        "rounded-md text-sm font-semibold transition-colors",
        size === "lg" ? "w-full px-4 py-2" : "min-w-[92px] px-4 py-1.5",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isFollowing
          ? "border bg-white hover:bg-muted"
          : "bg-primary text-primary-foreground hover:opacity-90",
        className,
      ].join(" ")}
    >
      {isFollowing ? "Following" : followLabel}
    </button>
  );
}