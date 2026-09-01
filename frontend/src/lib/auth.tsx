"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api";

/**
 * Session state for the whole app.
 *
 * <h2>Where the access token lives</h2>
 *
 * In memory, and nowhere else. Not localStorage, not sessionStorage: anything
 * readable by JavaScript is readable by a successful XSS, and an access token
 * is a bearer credential — whoever holds it is the user.
 *
 * The refresh token is already an HttpOnly cookie the browser attaches on its
 * own, so a page reload does not need a stored access token. It needs a call to
 * /auth/refresh, which is what {@link AuthProvider} does on mount. That is the
 * whole reason the backend was built this way.
 *
 * The cost is a brief loading state on every full page load. That is the correct
 * trade: the alternative is persisting a credential somewhere script can read it.
 */

export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";

export interface AuthUser {
  id: number;
  phone: string;
  email: string | null;
  role: UserRole;
  phoneVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial refresh attempt settles. Guards flash a loader on this. */
  loading: boolean;
  signIn: (accessToken: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
  /** fetch() with the bearer token attached and one automatic refresh-and-retry. */
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** The refresh route is cookie-authenticated, so it requires this CSRF marker. */
const CSRF_HEADER = "X-Refresh-Request";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // A ref, not state: authFetch must read the current token without being
  // recreated on every change, and a stale closure here would silently send an
  // expired token and log the user out.
  const accessToken = useRef<string | null>(null);

  const signIn = useCallback((token: string, nextUser: AuthUser) => {
    accessToken.current = token;
    setUser(nextUser);
  }, []);

  /** Exchanges the refresh cookie for a new access token. Null if there is no valid session. */
  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { [CSRF_HEADER]: "1" },
      });
      if (!res.ok) return null;

      const body = await res.json();
      accessToken.current = body.accessToken;
      setUser(body.user);
      return body.user;
    } catch {
      // Backend unreachable. Signed out rather than crashed — the public pages
      // still work without a session.
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Cleared regardless of what the server said. Signing out must always
      // leave the browser signed out, never fail halfway.
      accessToken.current = null;
      setUser(null);
    }
  }, []);

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const send = (token: string | null) =>
        fetch(`${API_BASE_URL}${path}`, {
          ...init,
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...init.headers,
          },
        });

      let response = await send(accessToken.current);

      // Access tokens last 15 minutes, so a 401 mid-session is expected rather
      // than exceptional. Refresh once and retry; only then treat it as a real
      // sign-out. Retried once, never in a loop.
      if (response.status === 401) {
        const refreshed = await refresh();
        if (refreshed) {
          response = await send(accessToken.current);
        }
      }

      return response;
    },
    [refresh],
  );

  useEffect(() => {
    // Restore the session on first load. Until this settles, guards must show a
    // loader rather than redirecting — otherwise every refresh of a protected
    // page bounces the user to the login screen before the session is known.
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
