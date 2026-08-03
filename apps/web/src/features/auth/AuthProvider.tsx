import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicUser } from "@arva/shared";
import { api, setAccessToken } from "@/lib/api";

type AuthState = {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (fullName: string, email: string, password: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((accessToken: string, nextUser: PublicUser) => {
    setAccessToken(accessToken);
    setUser(nextUser);
  }, []);

  const refreshMe = useCallback(async () => {
    const { user: me } = await api.me();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await api.refresh();
        if (cancelled) return;
        applySession(session.accessToken, session.user);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const session = await api.login({ email, password });
        applySession(session.accessToken, session.user);
        return session.user;
      },
      async register(fullName, email, password) {
        const session = await api.register({ fullName, email, password });
        applySession(session.accessToken, session.user);
        return session.user;
      },
      async logout() {
        try {
          await api.logout();
        } finally {
          setAccessToken(null);
          setUser(null);
        }
      },
      refreshMe,
    }),
    [user, loading, applySession, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
