"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  LoginPayload,
  RegisterPayload,
  RegistrationResponse,
  VerifyEmailPayload,
  AuthResponse,
  UserUpdatePayload,
} from "@/types";
import { authApi, usersApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegistrationResponse>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (payload: UserUpdatePayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage and verify with backend
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("arthsetu_token");
        const savedUserStr = localStorage.getItem("arthsetu_user");

        if (savedToken) {
          setToken(savedToken);
          let parsedUser: User | null = null;
          if (savedUserStr) {
            try {
              parsedUser = JSON.parse(savedUserStr);
              setUser(parsedUser);
            } catch {
              // Ignore JSON parse error
            }
          }

          // If we already have a cached user and token, unblock UI immediately
          if (parsedUser) {
            setIsLoading(false);
          }

          // Verify with /api/auth/me in background or foreground
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const verifiedUser = await authApi.getMe();
            clearTimeout(timeoutId);
            setUser(verifiedUser);
            localStorage.setItem("arthsetu_user", JSON.stringify(verifiedUser));
          } catch (err: any) {
            // Token expired or invalid
            if (err.status === 401) {
              localStorage.removeItem("arthsetu_token");
              localStorage.removeItem("arthsetu_user");
              setToken(null);
              setUser(null);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem("arthsetu_token", response.access_token);
      localStorage.setItem("arthsetu_user", JSON.stringify(response.user));
      if (response.user?.language_preference && ["en", "hi", "mr"].includes(response.user.language_preference)) {
        localStorage.setItem("arthsetu_lang", response.user.language_preference);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("arthsetu-language-change", {
              detail: { language: response.user.language_preference },
            })
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<RegistrationResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyEmail(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem("arthsetu_token", response.access_token);
      localStorage.setItem("arthsetu_user", JSON.stringify(response.user));
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("arthsetu_token");
    localStorage.removeItem("arthsetu_user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const updateProfile = async (payload: UserUpdatePayload): Promise<User> => {
    if (!user) throw new Error("No user logged in to update");
    const updated = await usersApi.updateProfile(user.id, payload);
    setUser(updated);
    localStorage.setItem("arthsetu_user", JSON.stringify(updated));
    if (updated.language_preference && ["en", "hi", "mr"].includes(updated.language_preference)) {
      localStorage.setItem("arthsetu_lang", updated.language_preference);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("arthsetu-language-change", {
            detail: { language: updated.language_preference },
          })
        );
      }
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        verifyEmail,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
