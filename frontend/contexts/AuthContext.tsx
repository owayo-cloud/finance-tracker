"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  logout: () => Promise<void>;
  validateAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const API_BASE = "http://127.0.0.1:8000/auth";

  const validateAuth = useCallback(async () => {
    try {
      // Check if running in browser
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Get auth data from localStorage
      const token = localStorage.getItem("access_token");
      const expiry = localStorage.getItem("token_expiry");
      const userData = localStorage.getItem("user");

      // Validate token exists
      if (!token || !expiry) {
        throw new Error("Missing authentication credentials");
      }

      // Validate token hasn't expired
      const expiryTime = Number(expiry);
      if (isNaN(expiryTime) || Date.now() / 1000 > expiryTime) {
        throw new Error("Session expired");
      }

      // Parse and validate user data
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (!parsedUser.full_name || !parsedUser.email) {
          throw new Error("Invalid user data");
        }
        setUser(parsedUser);
      } else {
        throw new Error("User data not found");
      }

      setIsLoading(false);
    } catch (error) {
      // Clear invalid auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }

      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      setAuthError(errorMessage);
      setIsLoading(false);
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    }
  }, [router]);

  const logout = useCallback(async () => {
    // Try to notify backend to revoke the refresh token. Even if this fails, proceed to clear local state.
    try {
      if (typeof window !== "undefined") {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          await fetch(`${API_BASE}/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
            // don't throw on non-2xx - we still clear local state below
          });
        }
      }
    } catch (err) {
      // network or server error - log and continue clearing local state
      // eslint-disable-next-line no-console
      console.warn("Logout request failed:", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }
      setUser(null);
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, logout, validateAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};