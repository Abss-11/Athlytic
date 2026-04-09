import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/api";
import type { UserRole } from "../types";

interface AuthUser {
  id?: string;
  name: string;
  role: UserRole;
  email: string;
  profile?: {
    sport?: string;
    age?: number;
    weight?: number;
    height?: number;
    bodyFatPercent?: number;
    sex?: string;
    activityLevel?: string;
    goalType?: string;
    dietaryPreference?: string;
    allergies?: string[];
    recentIllness?: string;
    recentInjuries?: string;
    medicalNotes?: string;
    goalsSummary?: string;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role: UserRole; sport?: string }) => Promise<void>;
  replaceUser: (nextUser: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("athlytic-token");
    const storedUser = window.localStorage.getItem("athlytic-user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    const response = await authApi.login({ email, password, role });
    const nextUser = response.data.user as AuthUser;
    const nextToken = response.data.token as string;

    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem("athlytic-user", JSON.stringify(nextUser));
    window.localStorage.setItem("athlytic-token", nextToken);
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; role: UserRole; sport?: string }) => {
      const response = await authApi.register(payload);
      const nextUser = response.data.user as AuthUser;
      const nextToken = response.data.token as string;

      setUser(nextUser);
      setToken(nextToken);
      window.localStorage.setItem("athlytic-user", JSON.stringify(nextUser));
      window.localStorage.setItem("athlytic-token", nextToken);
    },
    []
  );

  const replaceUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    window.localStorage.setItem("athlytic-user", JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem("athlytic-user");
    window.localStorage.removeItem("athlytic-token");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      replaceUser,
      logout,
    }),
    [login, logout, register, replaceUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
