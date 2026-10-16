"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import Avatar from "../avatar";
import FollowButton from "./FollowButton";
import type { ListState } from "../../app/hooks/useFollowLists";
import type { FollowTab, FollowListUser } from "../../lib/follow";
import { imgSrc } from "../../utils/getImgSrc";
import Image from "next/image";
import { FaUser } from "react-icons/fa6";
import Link from "next/link";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: FollowTab;
  onTabChange: (tab: FollowTab) => void;
  counts: Record<FollowTab, number>;
  list: ListState;
  pendingIds: Set<string>;
  onToggleFollow: (user: FollowListUser) => void;
  /** Optional: when provided, followers get a remove (✕) button. */
  onRemoveFollower?: (user: FollowListUser) => void;
  onRetry: () => void;
  currentUserId?: string;
  isOwnProfile: boolean;
}

const TABS: { id: FollowTab; label: string }[] = [
  { id: "followers", label: "Followers" },
  { id: "following", label: "Following" },
];

const EMPTY_COPY: Record<FollowTab, { title: string; body: string }> = {
  followers: {
    title: "No followers yet",
    body: "When people follow you, they'll show up here.",
  },
  following: {
    title: "Not following anyone",
    body: "Follow writers you like and they'll show up here.",
  },
};

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="space-y-1 px-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-2.5">
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function Message({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

export default function FollowListModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  counts,
  list,
  pendingIds,
  onToggleFollow,
  onRemoveFollower,
  onRetry,
  currentUserId,
  isOwnProfile
}: FollowListModalProps) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Clear search whenever the modal opens or the tab changes.
  useEffect(() => setQuery(""), [isOpen, activeTab]);

  // Scroll lock, focus management, Escape, and a simple focus trap.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list?.users;
    return list.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q),
    );
  }, [list.users, query]);

  if (!isOpen) return null;
  {
  }
  const showSkeleton = list.loading && list?.length === 0;
  const empty = EMPTY_COPY[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[36rem] max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-xl"
      >
        {/* Header: tabs + close */}
        <div className="flex items-center justify-between border-b px-4 pt-3">
          <h2 id={titleId} className="sr-only">
            Followers and following
          </h2>
          <div role="tablist" aria-label="Connections" className="flex flex-1">
            {TABS.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls="follow-panel"
                  onClick={() => onTabChange(tab.id)}
                  className={`-mb-px flex-1 border-b-2 px-2 pb-3 pt-1 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {counts[tab.id].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-2 ml-2 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <label className="relative block">
            <span className="sr-only">Search {activeTab}</span>
            <FaSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-md border bg-muted py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        {/* List */}
        <div
          id="follow-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          aria-busy={list.loading}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3"
        >
          {showSkeleton ? (
            <SkeletonRows />
          ) : list.error && list?.users?.length === 0 ? (
            <Message
              title={list.error}
              action={
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 rounded-md border px-4 py-1.5 text-sm font-semibold hover:bg-muted"
                >
                  Retry
                </button>
              }
            />
          ) : list.users.length === 0 ? (
            <Message title={empty.title} body={empty.body} />
          ) : visibleUsers.length === 0 ? (
            <Message
              title={`No results for "${query.trim()}"`}
              body="Check the spelling or try another name."
            />
          ) : (
            <ul className="px-2">
              {visibleUsers.map((user) => {
                const pending = pendingIds.has(user.id);
                const isMe = user.id === currentUserId;
                const followLabel =
                  isOwnProfile && activeTab === "followers"
                    ? "Follow back"
                    : "Follow";
                return (
                  <div
                    key={user.id}
                    className="relative flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
                  >
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name ?? "User avatar"}
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <FaUser className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/authors/${user.id}`}
                        className="block truncate text-sm font-semibold after:absolute after:inset-0 after:content-['']"
                      >
                        {user.name}
                      </Link>
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center gap-2">
                      {!isMe && (
                        <FollowButton
                          isFollowing={user.isFollowing}
                          pending={pending}
                          followLabel={followLabel}
                          onClick={() => onToggleFollow(user)}
                        />
                      )}

                      {!isMe &&
                        activeTab === "followers" &&
                        onRemoveFollower &&
                        !isMe && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onRemoveFollower(user)}
                            aria-label={`Remove ${user.name} as a follower`}
                            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
                          >
                            <FaTimes aria-hidden="true" />
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
