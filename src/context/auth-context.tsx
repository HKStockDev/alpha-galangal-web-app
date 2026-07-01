"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  fetchCurrentUser,
  fetchMyOrganizations,
  login as apiLogin,
  registerAccount,
  type User,
} from "@/lib/api";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";

const TOKEN_KEY = "access_token";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  /** Apply a fresh `/auth/me`-shaped payload (e.g. after avatar upload) without stale GET cache. */
  applyUserFromMe: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function postAuthNavigation(
  token: string,
  userData: User,
  router: ReturnType<typeof useRouter>
) {
  if (userData.is_platform_admin) {
    router.push(ADMIN_DASHBOARD);
    return;
  }
  try {
    const orgs = await fetchMyOrganizations(token);
    if (orgs.length === 0) {
      router.push("/onboarding");
      return;
    }
  } catch {
    /* ignore; default to org dashboard */
  }
  router.push(ORG_DASHBOARD);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async (token: string) => {
    try {
      const userData = await fetchCurrentUser(token);
      setUser(userData);
    } catch {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    const token = getStoredToken();
    if (token) await loadUser(token);
  }, [loadUser]);

  const applyUserFromMe = useCallback((next: User) => {
    setUser(next);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAccessToken(token);
    loadUser(token).finally(() => setIsLoading(false));
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setAccessToken(data.access_token);
      const userData = await fetchCurrentUser(data.access_token);
      setUser(userData);
      await postAuthNavigation(data.access_token, userData, router);
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const data = await registerAccount(email, password, fullName);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setAccessToken(data.access_token);
      const userData = await fetchCurrentUser(data.access_token);
      setUser(userData);
      router.push("/onboarding");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refetchUser,
        applyUserFromMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
