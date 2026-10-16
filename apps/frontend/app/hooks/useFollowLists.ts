"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  followApi,
  getAllFollowingIds,
  getFollowPage,
  type FollowListUser,
  type FollowTab,
} from "../../lib/follow";

export interface ListState {
  users: FollowListUser[];
  loading: boolean;
  /** True while fetching page 2+, so the existing rows stay on screen. */
  loadingMore: boolean;
  error: string;
  loaded: boolean;
  page: number;
  hasMore: boolean;
}

const EMPTY_LIST: ListState = {
  users: [],
  loading: false,
  loadingMore: false,
  error: "",
  loaded: false,
  page: 0,
  hasMore: false,
};

interface UseFollowListsOptions {
  /** ID of the profile owner whose lists are shown. Lists wait until this is set. */
  userId: string;
  /**
   * ID of the logged-in user. Defaults to `userId` (own profile).
   * Pass "" when logged out; follow actions then call `onRequireAuth`.
   */
  viewerId?: string;
  followers: number;
  following: number;
  /** Called when a logged-out visitor tries to follow someone. */
  onRequireAuth?: () => void;
}

/**
 * Follow state + handlers for a profile page (own profile or someone else's).
 * - Counts come from the profile; lists are lazy-loaded (paged) when the modal opens.
 * - Follow/unfollow is optimistic and rolls back on failure.
 * - "Am I following this person?" is resolved from the *viewer's* following ids,
 *   because the list endpoints don't report it.
 */
export function useFollowLists({
  userId,
  viewerId = userId,
  followers,
  following,
  onRequireAuth,
}: UseFollowListsOptions) {
  const isOwnProfile = Boolean(viewerId) && viewerId === userId;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FollowTab>("followers");
  const [counts, setCounts] = useState({ followers, following });
  const [lists, setLists] = useState<Record<FollowTab, ListState>>({
    followers: EMPTY_LIST,
    following: EMPTY_LIST,
  });
  // User ids whose follow/unfollow request is currently in flight.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const requireAuthRef = useRef(onRequireAuth);
  useEffect(() => {
    requireAuthRef.current = onRequireAuth;
  }, [onRequireAuth]);

  // Ids of everyone the VIEWER follows (null = not fetched yet).
  const followingIdsRef = useRef<Set<string> | null>(null);
  const followingIdsRequest = useRef<Promise<Set<string>> | null>(null);

  const ensureFollowingIds = useCallback((): Promise<Set<string>> => {
    if (followingIdsRef.current)
      return Promise.resolve(followingIdsRef.current);
    if (!followingIdsRequest.current) {
      followingIdsRequest.current = getAllFollowingIds(viewerId)
        .then((ids) => {
          followingIdsRef.current = ids;
          return ids;
        })
        .finally(() => {
          followingIdsRequest.current = null;
        });
    }
    return followingIdsRequest.current;
  }, [viewerId]);

  // Keep counts in sync when the profile finishes loading.
  useEffect(() => {
    setCounts({ followers, following });
  }, [followers, following]);

  // Start fresh if the profile owner or viewer changes.
  useEffect(() => {
    setLists({ followers: EMPTY_LIST, following: EMPTY_LIST });
    followingIdsRef.current = null;
    followingIdsRequest.current = null;
  }, [userId, viewerId]);

  const loadTab = useCallback(
    async (tab: FollowTab, page = 1) => {
      if (!userId) return;
      const append = page > 1;

      setLists((p) => ({
        ...p,
        [tab]: { ...p[tab], loading: !append, loadingMore: append, error: "" },
      }));

      try {
        // On your own Following tab everyone is followed by definition, so skip the lookup.
        const skipLookup = isOwnProfile && tab === "following";
        const needIds = Boolean(viewerId) && !skipLookup;

        const [res, ids] = await Promise.all([
          getFollowPage(userId, tab, page),
          needIds ? ensureFollowingIds() : Promise.resolve(null),
        ]);

        const incoming = res.users.map((u) => ({
          ...u,
          isFollowing: skipLookup ? true : ids ? ids.has(u.id) : false,
          isSelf: Boolean(viewerId) && u.id === viewerId,
        }));

        setLists((p) => {
          const previous = append ? p[tab].users : [];
          const seen = new Set(previous.map((u) => u.id));
          const merged = [
            ...previous,
            ...incoming.filter((u) => !seen.has(u.id)),
          ];
          return {
            ...p,
            [tab]: {
              users: merged,
              loading: false,
              loadingMore: false,
              error: "",
              loaded: true,
              page: res.page,
              hasMore: res.hasMore,
            },
          };
        });

        // The backend's total is the source of truth for the tab's count.
        if (!append && res.total !== undefined) {
          const total = res.total;
          setCounts((c) => ({ ...c, [tab]: total }));
        }
      } catch {
        if (append) {
          toast.error("Couldn't load more. Try again.");
          setLists((p) => ({ ...p, [tab]: { ...p[tab], loadingMore: false } }));
        } else {
          setLists((p) => ({
            ...p,
            [tab]: {
              ...p[tab],
              loading: false,
              error: "Couldn't load this list. Try again.",
            },
          }));
        }
      }
    },
    [userId, viewerId, isOwnProfile, ensureFollowingIds],
  );

  // Lazy-load the active tab. An error blocks auto-fetch so we never loop; Retry calls loadTab.
  useEffect(() => {
    if (!isOpen || !userId) return;
    const s = lists[activeTab];
    if (!s.loaded && !s.loading && !s.error) void loadTab(activeTab);
  }, [isOpen, userId, activeTab, lists, loadTab]);

  const open = useCallback((tab: FollowTab) => {
    setActiveTab(tab);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const loadMore = useCallback(() => {
    const s = lists[activeTab];
    if (s.loading || s.loadingMore || !s.hasMore) return;
    void loadTab(activeTab, s.page + 1);
  }, [lists, activeTab, loadTab]);

  const setPending = useCallback((id: string, on: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Keep a user's follow state consistent across both tabs.
  const patchUser = useCallback(
    (id: string, patch: Partial<FollowListUser>) => {
      const apply = (s: ListState): ListState => ({
        ...s,
        users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      });
      setLists((p) => ({
        followers: apply(p.followers),
        following: apply(p.following),
      }));
    },
    [],
  );

  const toggleFollow = useCallback(
    async (user: FollowListUser) => {
      if (!viewerId) {
        requireAuthRef.current?.();
        return;
      }
      if (user.isSelf || pendingIds.has(user.id)) return;

      const next = !user.isFollowing;
      const delta = next ? 1 : -1;

      const syncIds = (isFollowing: boolean) => {
        if (isFollowing) followingIdsRef.current?.add(user.id);
        else followingIdsRef.current?.delete(user.id);
      };
      // The owner's "following" count only moves when the owner is the viewer.
      const bumpFollowing = (d: number) => {
        if (isOwnProfile) {
          setCounts((c) => ({ ...c, following: Math.max(0, c.following + d) }));
        }
      };

      setPending(user.id, true);
      patchUser(user.id, { isFollowing: next });
      syncIds(next);
      bumpFollowing(delta);

      try {
        if (next) await followApi.follow(user.id);
        else await followApi.unfollow(user.id);
        // Own Following list is now out of date; refetch next time that tab is shown.
        if (isOwnProfile && activeTab !== "following") {
          setLists((p) => ({
            ...p,
            following: { ...p.following, loaded: false },
          }));
        }
      } catch {
        patchUser(user.id, { isFollowing: user.isFollowing });
        syncIds(user.isFollowing);
        bumpFollowing(-delta);
        toast.error(
          next
            ? "Couldn't follow. Try again."
            : "Couldn't unfollow. Try again.",
        );
      } finally {
        setPending(user.id, false);
      }
    },
    [viewerId, isOwnProfile, activeTab, pendingIds, patchUser, setPending],
  );

  /**
   * Call when the viewer follows/unfollows the profile owner (e.g. the Follow
   * button on someone's profile): bumps the followers count and marks the
   * followers list stale so the viewer appears/disappears next time it opens.
   */
  const adjustFollowers = useCallback((delta: number) => {
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + delta) }));
    setLists((p) => ({ ...p, followers: { ...p.followers, loaded: false } }));
  }, []);

  const modalProps = useMemo(
    () => ({
      isOpen,
      onClose: close,
      activeTab,
      onTabChange: setActiveTab,
      counts,
      list: lists[activeTab],
      pendingIds,
      onToggleFollow: toggleFollow,
      onRetry: () => loadTab(activeTab),
      onLoadMore: loadMore,
      isOwnProfile,
    }),
    [
      isOpen,
      close,
      activeTab,
      counts,
      lists,
      pendingIds,
      toggleFollow,
      loadTab,
      loadMore,
      isOwnProfile,
    ],
  );

  return { counts, open, modalProps, isOwnProfile, adjustFollowers };
}
