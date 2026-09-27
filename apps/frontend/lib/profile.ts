import { apiRequest } from "./api";

export interface ProfileUser {
  id: string;
  name?: string;
  email: string;
}

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

export const profileApi = {
  get() {
    return apiRequest<ProfileResponse>("/profile", { method: "GET" });
  },

  update(data: FormData) {
    return apiRequest<ProfileResponse>("/profile", {
      method: "PATCH",
      data,
    });
  },
};
