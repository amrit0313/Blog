"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { followApi } from "../../lib/follow";

interface UseFollowStatusOptions {
  /** The user whose profile is being viewed. */
  targetId: string;
  /** The logged-in user's id ("" when logged out). */
  viewerId?: string;
  /** Called when a logged-out visitor taps Follow. */
  onRequireAuth?: () => void;
  /** Called after an optimistic change (+1 follow, -1 unfollow) and on rollback. */
  onChange?: (delta: 1 | -1) => void;
}

/**
 * Follow state + toggle for a single user (the Follow button on a profile page).
 * Loads the initial status, then toggles optimistically with rollback.
 */
export function useFollowStatus({
  targetId,
  viewerId = "",
  onRequireAuth,
  onChange,
}: UseFollowStatusOptions) {
  const canFollow = Boolean(targetId) && targetId !== viewerId;

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(Boolean(viewerId) && canFollow);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!canFollow || !viewerId) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    followApi
      .getStatus(targetId)
      .then((res) => {
        if (!cancelled) {
          setIsFollowing(Boolean(res.isFollowing ?? res.result?.isFollowing));
        }
      })
      .catch(() => {
        // Leave as "not following"; the toggle still works.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, viewerId, canFollow]);

  const toggle = useCallback(async () => {
    if (!viewerId) {
      onRequireAuth?.();
      return;
    }
    if (!canFollow || loading || pending) return;

    const next = !isFollowing;
    const delta = next ? 1 : -1;

    setPending(true);
    setIsFollowing(next);
    onChange?.(delta);

    try {
      if (next) await followApi.follow(targetId);
      else await followApi.unfollow(targetId);
    } catch {
      setIsFollowing(!next);
      onChange?.(next ? -1 : 1);
      toast.error(
        next ? "Couldn't follow. Try again." : "Couldn't unfollow. Try again.",
      );
    } finally {
      setPending(false);
    }
  }, [
    viewerId,
    canFollow,
    loading,
    pending,
    isFollowing,
    targetId,
    onRequireAuth,
    onChange,
  ]);

  return { isFollowing, loading, pending, canFollow, toggle };
}
