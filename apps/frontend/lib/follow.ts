import { apiRequest } from "./api";

/**
 * Avatar value returned by the API. Can be a plain URL or an object.
 */
export type FollowAvatar = string | { key?: string; url?: string };

/**
 * Response returned by follow, unfollow and follow-status endpoints.
 */
export interface FollowResponse {
  message?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  result?: {
    isFollowing?: boolean;
    followersCount?: number;
    followingCount?: number;
  };
}

/**
 * A user entry returned by the followers/following endpoints.
 * The backend may nest the user under `user`, `follower` or `following`,
 * or place fields under `profile`, so every shape is accepted here.
 */
export interface FollowUser {
  id?: string;
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: FollowAvatar;
  isFollowing?: boolean;
  profile?: {
    name?: string;
    username?: string;
    email?: string;
    avatar?: FollowAvatar;
  };
  user?: FollowUser;
  follower?: FollowUser;
  following?: FollowUser;
}

export type FollowTab = "followers" | "following";

/**
 * Response returned by the followers/following list endpoints.
 */
export interface FollowUsersResponse {
  message?: string;
  count?: number;
  page?: number;
  limit?: number;
  result?: FollowUser[];
  users?: FollowUser[];
  followers?: FollowUser[];
  following?: FollowUser[];
}

/**
 * Normalizes the different list shapes the API can return into a flat
 * array of users with name, username, email and avatar resolved.
 *
 * @param response - Raw followers/following response.
 * @returns A normalized list of users.
 */
export function getFollowUsers(response: FollowUsersResponse): FollowUser[] {
  const users = Array.isArray(response.users)
    ? response.users
    : Array.isArray(response.followers)
      ? response.followers
      : Array.isArray(response.following)
        ? response.following
        : Array.isArray(response.result)
          ? response.result
          : [];

  return users.map((entry) => {
    const user = entry.user ?? entry.follower ?? entry.following ?? entry;
    const profile = user.profile;

    return {
      ...user,
      name: user.name ?? profile?.name,
      username: user.username ?? profile?.username,
      email: user.email ?? profile?.email,
      avatar: user.avatar ?? profile?.avatar,
    };
  });
}

/* ───────────── UI-facing shape ───────────── */

/**
 * Strict, render-ready user used by the follow list UI.
 * Everything the components need is guaranteed to be present.
 */
export interface FollowListUser {
  isSelf: boolean;
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  /** Does the authenticated user follow this person? */
  isFollowing: boolean;
}

/** Resolves an avatar value (string or object) to a URL. */
export function getAvatarUrl(avatar?: FollowAvatar): string | undefined {
  if (!avatar) return undefined;
  return typeof avatar === "string" ? avatar : avatar.url || undefined;
}

/**
 * Converts a normalized API user into a render-ready user.
 * Returns null when the entry has no id (it can't be followed/unfollowed).
 *
 * In the "following" tab every entry is followed by definition. In the
 * "followers" tab we rely on `isFollowing` from the API (false if absent).
 */
export function toFollowListUser(
  user: FollowUser,
  tab: FollowTab,
): FollowListUser | null {
  const id = user.id ?? user._id;
  if (!id) return null;

  const name =
    user.name || user.username || user.email?.split("@")[0] || "Unknown user";

  return {
    id,
    name,
    // Avoid showing "maya / @maya" when the name is just the username.
    username:
      user.username && user.username !== name ? user.username : undefined,
    avatar: getAvatarUrl(user.avatar),
    isFollowing: tab === "following" ? true : Boolean(user.isFollowing),
    isSelf: false,
  };
}

export interface FollowPageParams {
  page?: number;
  limit?: number;
}

const withPaging = (path: string, params?: FollowPageParams) => {
  if (!params) return path;
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
};

const followPath = (userId: string) => `/following/${userId}/follow`;
const followUsersPath = (userId: string, relation: "followers" | "following") =>
  `/following/${userId}/${relation}`;

/**
 * Client methods for following users and listing followers/following.
 */
export const followApi = {
  /**
   * Follows a user.
   *
   * @param userId - ID of the user to follow.
   * @returns A promise containing the follow response.
   */
  follow(userId: string) {
    return apiRequest<FollowResponse>(followPath(userId), { method: "POST" });
  },

  /**
   * Unfollows a user.
   *
   * @param userId - ID of the user to unfollow.
   * @returns A promise containing the unfollow response.
   */
  unfollow(userId: string) {
    return apiRequest<FollowResponse>(followPath(userId), {
      method: "DELETE",
    });
  },

  /**
   * Checks whether the authenticated user follows the given user.
   *
   * @param userId - ID of the user to check.
   * @returns A promise containing the follow status response.
   */
  getStatus(userId: string) {
    return apiRequest<FollowResponse>(`/following/${userId}/follow-status`, {
      method: "GET",
    });
  },

  /**
   * Retrieves the followers of a user.
   *
   * @param userId - ID of the user whose followers should be listed.
   * @param params - Optional page/limit (backend caps limit at 50).
   * @returns A promise containing the followers response.
   */
  getFollowers(userId: string, params?: FollowPageParams) {
    return apiRequest<FollowUsersResponse>(
      withPaging(followUsersPath(userId, "followers"), params),
      { method: "GET" },
    );
  },

  /**
   * Retrieves the users a given user is following.
   *
   * @param userId - ID of the user whose following list should be retrieved.
   * @param params - Optional page/limit (backend caps limit at 50).
   * @returns A promise containing the following response.
   */
  getFollowing(userId: string, params?: FollowPageParams) {
    return apiRequest<FollowUsersResponse>(
      withPaging(followUsersPath(userId, "following"), params),
      { method: "GET" },
    );
  },
};

export const FOLLOW_PAGE_SIZE = 20;

export interface FollowPage {
  users: FollowListUser[];
  /** Total number of followers/following reported by the backend. */
  total?: number;
  page: number;
  hasMore: boolean;
}

/**
 * Fetches one page of a tab's list and returns render-ready users.
 *
 * @param userId - ID of the profile owner.
 * @param tab - Which list to load.
 * @param page - 1-based page number.
 * @param limit - Page size.
 */
export async function getFollowPage(
  userId: string,
  tab: FollowTab,
  page = 1,
  limit = FOLLOW_PAGE_SIZE,
): Promise<FollowPage> {
  const params = { page, limit };
  const response =
    tab === "followers"
      ? await followApi.getFollowers(userId, params)
      : await followApi.getFollowing(userId, params);

  const users = getFollowUsers(response)
    .map((u) => toFollowListUser(u, tab))
    .filter((u): u is FollowListUser => u !== null);

  const total = typeof response.count === "number" ? response.count : undefined;
  const currentPage = response.page ?? page;
  const pageSize = response.limit ?? limit;
  const hasMore =
    total !== undefined
      ? currentPage * pageSize < total
      : users.length >= pageSize;

  return { users, total, page: currentPage, hasMore };
}

/**
 * Fetches the first page of a tab's list (kept for backwards compatibility).
 */
export async function getFollowList(
  userId: string,
  tab: FollowTab,
): Promise<FollowListUser[]> {
  return (await getFollowPage(userId, tab)).users;
}

/**
 * Collects the ids of everyone the profile owner follows, walking all pages.
 * Used to work out "Follow back" vs "Following" in the Followers tab, since the
 * followers endpoint doesn't report that itself.
 *
 * Only valid when `userId` is the logged-in user (their following list is
 * exactly "people I follow").
 */
export async function getAllFollowingIds(userId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const MAX_PAGES = 100; // safety stop
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getFollowPage(userId, "following", page, 50);
    res.users.forEach((u) => ids.add(u.id));
    if (!res.hasMore) break;
  }
  return ids;
}
