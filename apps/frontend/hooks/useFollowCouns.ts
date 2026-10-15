"use client";

import { useEffect, useState } from "react";
import { followApi, getFollowUsers } from "../lib/follow";

export interface FollowCounts {
  followers?: number;
  following?: number;
}

/**
 * Loads followers/following counts for a user. Values stay undefined until
 * loaded (or if loading fails) so the UI can render a placeholder.
 */
export function useFollowCounts(userId?: string) {
  const [counts, setCounts] = useState<FollowCounts>({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      followApi.getFollowers(userId),
      followApi.getFollowing(userId),
    ])
      .then(([followers, following]) => {
        if (cancelled) return;
        setCounts({
          followers: followers.count ?? getFollowUsers(followers).length,
          following: following.count ?? getFollowUsers(following).length,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { counts, setCounts };
}
