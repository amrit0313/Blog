"use client";

import type { FollowTab } from "../../lib/follow";

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface ProfileStatsProps {
  blogsCount: number;
  followersCount: number;
  followingCount: number;
  onOpen: (tab: FollowTab) => void;
  loading?: boolean;
}

function Stat({
  value,
  label,
  onClick,
  loading,
}: {
  value: number;
  label: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const content = (
    <>
      <span className="block text-lg font-bold leading-tight">
        {loading ? (
          <span className="mx-auto block h-5 w-8 animate-pulse rounded bg-muted" />
        ) : (
          compact.format(value)
        )}
      </span>
      <span className="block text-xs text-muted-foreground">{label}</span>
    </>
  );

  const base = "px-2 py-3 text-center";
  if (!onClick) return <div className={base}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${value.toLocaleString()} ${label}. View list`}
      className={`${base} transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary`}
    >
      {content}
    </button>
  );
}

export default function ProfileStats({
  blogsCount,
  followersCount,
  followingCount,
  onOpen,
  loading,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-3 borde overflow-hidden  ">
      <Stat
        value={blogsCount}
        label={blogsCount === 1 ? "Blog" : "Blogs"}
        loading={loading}
      />
      <Stat
        value={followersCount}
        label="Followers"
        loading={loading}
        onClick={() => onOpen("followers")}
      />
      <Stat
        value={followingCount}
        label="Following"
        loading={loading}
        onClick={() => onOpen("following")}
      />
    </div>
  );
}
