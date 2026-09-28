import axios, { AxiosRequestConfig } from "axios";
import type {
  AuthResponse,
  ForgotPasswordCredentials,
  LoginCredentials,
  MessageResponse,
  RegisterCredentials,
  ResetPasswordCredentials,
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
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

function tokenExpiresSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return Boolean(payload.exp && payload.exp * 1000 - Date.now() <= 30_000);
  } catch {
    return false;
  }
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new ApiError("Authentication service is not configured.", 0);
  }

  return `${baseUrl.replace(/\/$/, "")}/api`;
}

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getStoredToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ token?: string }>(`${getApiBaseUrl()}/auth/refresh`, undefined, {
        withCredentials: true,
      })
      .then((response) => {
        if (!response.data.token) return null;
        storeToken(response.data.token);
        return response.data.token;
      })
      .catch(() => {
        clearStoredToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = getStoredToken();
  const isRefreshRequest = config.url?.endsWith("/auth/refresh");

  if (token && !isRefreshRequest && tokenExpiresSoon(token)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      config.headers.set("Authorization", `Bearer ${refreshedToken}`);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isRefreshRequest = originalRequest?.url?.endsWith("/auth/refresh");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      getStoredToken()
    ) {
      originalRequest._retry = true;
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${refreshedToken}`,
        };
        return api.request(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

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

  forgotPassword(credentials: ForgotPasswordCredentials) {
    return apiRequest<MessageResponse>("/auth/forgot-password", {
      method: "POST",
      data: credentials,
    });
  },

  resetPassword(credentials: ResetPasswordCredentials) {
    return apiRequest<MessageResponse>("/auth/reset-password", {
      method: "POST",
      data: credentials,
    });
  },
};
