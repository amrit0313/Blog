"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ApiError,
  authApi,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "../lib/api";
import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth";
import { toast } from "sonner";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toUser(response: AuthResponse) {
  const candidate = response.payload ?? response.user;

  if (!candidate?.id || !candidate.email) {
    throw new ApiError("The authentication response was invalid.", 0);
  }

  return {
    id: String(candidate.id),
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
  } satisfies AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    if (!getStoredToken()) {
      setUser(null);
      return null;
    }

    try {
      const nextUser = toUser(await authApi.currentUser());
      setUser(nextUser);
      return nextUser;
    } catch {
      clearStoredToken();
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      if (!getStoredToken()) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const nextUser = toUser(await authApi.currentUser());
        if (!cancelled) setUser(nextUser);
      } catch {
        clearStoredToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials: LoginCredentials) {
    const response = await authApi.login(credentials);
    if (!response.token) {
      throw new ApiError("The authentication response was invalid.", 0);
    }

    storeToken(response.token);
    const nextUser = toUser(response);
    setUser(nextUser);
    toast.success(response.message ?? "Login successful.");
    return nextUser;
  }

  async function register(credentials: RegisterCredentials) {
    const response = await authApi.register(credentials);
    if (!response.token) {
      throw new ApiError("The authentication response was invalid.", 0);
    }

    storeToken(response.token);
    const nextUser = toUser(response);
    setUser(nextUser);
    toast.success(response.message ?? "Registration successful.");
    return nextUser;
  }

  function logout() {
    clearStoredToken();
    setUser(null);
    toast.success("Logged out successfully.");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
