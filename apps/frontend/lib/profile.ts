import { apiRequest } from "./api";

/**
 * Basic user information returned with a profile.
 */
export interface ProfileUser {
  id: string;
  name?: string;
  email: string;
}

/**
 * Profile data returned by the profile endpoints.
 */
export interface ProfileData {
  user?: ProfileUser;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileResponse {
  message?: string;
  profile?: ProfileData;
}

/**
 * Client methods for retrieving and updating user profiles.
 */
export const profileApi = {
  /**
   * Retrieves the authenticated user's profile.
   *
   * @returns A promise containing the current user's profile response.
   */
  get() {
    return apiRequest<ProfileResponse>("/profile", { method: "GET" });
  },

  /**
   * Retrieves a public profile by user ID.
   *
   * @param userId - ID of the user whose profile should be retrieved.
   * @returns A promise containing the public profile response.
   */
  getPublic(userId: string) {
    return apiRequest<ProfileResponse>(`/profile/${userId}`, {
      method: "GET",
    });
  },

  /**
   * Updates the authenticated user's profile.
   *
   * @param data - Form data containing profile fields and an optional avatar.
   * @returns A promise containing the updated profile response.
   */
  update(data: FormData) {
    return apiRequest<ProfileResponse>("/profile", {
      method: "PATCH",
      data,
    });
  },
};
