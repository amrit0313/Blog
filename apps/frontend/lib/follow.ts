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
   * @returns A promise containing the followers response.
   */
  getFollowers(userId: string) {
    return apiRequest<FollowUsersResponse>(
      followUsersPath(userId, "followers"),
      { method: "GET" },
    );
  },

  /**
   * Retrieves the users a given user is following.
   *
   * @param userId - ID of the user whose following list should be retrieved.
   * @returns A promise containing the following response.
   */
  getFollowing(userId: string) {
    return apiRequest<FollowUsersResponse>(
      followUsersPath(userId, "following"),
      { method: "GET" },
    );
  },
};
