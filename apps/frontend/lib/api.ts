import axios, { AxiosRequestConfig } from "axios";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth";

export const TOKEN_STORAGE_KEY = "nepalcanblog_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new ApiError("Authentication service is not configured.", 0);
  }

  return baseUrl.replace(/\/$/, "");
}

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getStoredToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function apiRequest<T>(
  path: string,
  options: AxiosRequestConfig = {},
) {
  try {
    const requestOptions = { ...options };
    if (
      typeof FormData !== "undefined" &&
      requestOptions.data instanceof FormData
    ) {
      requestOptions.headers = {
        ...requestOptions.headers,
        "Content-Type": undefined,
      };
    }

    const response = await api.request<T>({
      url: path,
      ...requestOptions,
    });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as { message?: string } | undefined;

      throw new ApiError(
        error.response
          ? (data?.message ?? "The request could not be completed.")
          : "Unable to reach the authentication service.",
        status,
      );
    }

    throw new ApiError("Unable to reach the authentication service.", 0);
  }
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      data: credentials,
    });
  },

  register(credentials: RegisterCredentials) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      data: credentials,
    });
  },
  // The current Express API exposes the authenticated-user check as POST /auth/me.
  currentUser() {
    return apiRequest<AuthResponse>("/auth/me", { method: "POST" });
  },

  forgotPassword(credentials: any) {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      data: credentials,
    });
  },

  resetPassword(credentials: any) {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      data: credentials,
    });
  },
};
