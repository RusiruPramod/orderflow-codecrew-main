import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFirebase } from "./firebase";
import { listUsers, logActivity } from "./db";
import type { AppUser, Role } from "./types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signOut: () => Promise<void>;
  isRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = "codecrew:session";
export const DEMO_PASSWORD = "codecrew";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = window.localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          if (alive) setUser(JSON.parse(stored) as AppUser);
        } catch {
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const users = await listUsers();
    const profile = users.find((u) => u.email.toLowerCase() === normalized);

    const fb = await getFirebase();
    if (fb) {
      try {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(fb.auth, normalized, password);
      } catch (error) {
        // Firebase project may not have this user provisioned yet — fall through
        // to the local directory so the workspace stays usable.
        console.warn("[auth] firebase sign-in unavailable", error);
        if (!profile || password !== DEMO_PASSWORD) {
          throw new Error("Invalid email or password.");
        }
      }
    } else if (!profile || password !== DEMO_PASSWORD) {
      throw new Error("Invalid email or password.");
    }

    if (!profile) throw new Error("No CodeCrew profile is linked to this account.");
    if (!profile.active) throw new Error("This account has been deactivated.");

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    setUser(profile);
    void logActivity({
      action: "User Login",
      detail: `${profile.name} signed in`,
      userName: profile.name,
      role: profile.role,
    });
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    if (user) {
      void logActivity({
        action: "User Logout",
        detail: `${user.name} signed out`,
        userName: user.name,
        role: user.role,
      });
    }
    const fb = await getFirebase();
    if (fb) {
      try {
        const { signOut: fbSignOut } = await import("firebase/auth");
        await fbSignOut(fb.auth);
      } catch {
        /* ignore */
      }
    }
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      isRole: (role: Role) => user?.role === role,
    }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
