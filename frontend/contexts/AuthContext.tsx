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
  logout: () => void;
  validateAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

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

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("user");
    }
    setUser(null);
    router.push("/auth");
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