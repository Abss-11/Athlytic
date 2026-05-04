import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, extractApiErrorMessage, setApiToken } from "../api/client";
import type { AuthResponse, AuthUser, UserRole } from "../types";

type LoginPayload = {
  email: string;
  password: string;
  role: UserRole;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sport?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  isAuthenticating: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_STORAGE_KEY = "@athlytic/mobile/token";
const USER_STORAGE_KEY = "@athlytic/mobile/user";

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string, user: AuthUser) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
  ]);
}

async function clearSession() {
  await Promise.all([AsyncStorage.removeItem(TOKEN_STORAGE_KEY), AsyncStorage.removeItem(USER_STORAGE_KEY)]);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [storedToken, storedUserJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (storedToken && storedUserJson) {
          const parsedUser = JSON.parse(storedUserJson) as AuthUser;
          setToken(storedToken);
          setUser(parsedUser);
          setApiToken(storedToken);
        }
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        await clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, []);

  async function login(payload: LoginPayload) {
    setIsAuthenticating(true);
    try {
      const response = await api.post<AuthResponse>("/auth/login", payload);
      const nextToken = response.data.token;
      const nextUser = response.data.user;

      setToken(nextToken);
      setUser(nextUser);
      setApiToken(nextToken);
      await persistSession(nextToken, nextUser);
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, "Could not login right now."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function register(payload: RegisterPayload) {
    setIsAuthenticating(true);
    try {
      const response = await api.post<AuthResponse>("/auth/register", payload);
      const nextToken = response.data.token;
      const nextUser = response.data.user;

      setToken(nextToken);
      setUser(nextUser);
      setApiToken(nextToken);
      await persistSession(nextToken, nextUser);
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, "Could not create account right now."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function logout() {
    setUser(null);
    setToken(null);
    setApiToken(null);
    await clearSession();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      isAuthenticating,
      login,
      register,
      logout,
    }),
    [user, token, isBootstrapping, isAuthenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
