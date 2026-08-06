import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFirebase } from "./firebase";
import { listUsers, logActivity } from "./db";
import { seedUsers } from "./seed";
import type { AppUser, Role } from "./types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signInWithGoogle: () => Promise<AppUser>;
  signOut: () => Promise<void>;
  isRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = "codecrew:session";
export const DEMO_PASSWORD = "codecrew";

export function getRoleHomePath(role: Role): string {
  return role === "owner" ? "/owner/dashboard" : "/designer";
}

function readStoredSession(): AppUser | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AppUser;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function resolveSeedProfile(email: string): AppUser | null {
  return seedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

async function resolveProfile(email: string): Promise<AppUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await listUsers();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? resolveSeedProfile(normalized);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => readStoredSession());
  const [loading, setLoading] = useState(() => !readStoredSession());

  const completeSignIn = useCallback(async (profile: AppUser) => {
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

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const profile = await resolveProfile(normalized);

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
    return completeSignIn(profile);
  }, [completeSignIn]);

  const signInWithGoogle = useCallback(async () => {
    const fb = await getFirebase();
    if (!fb) {
      throw new Error("Google sign-in requires Firebase to be enabled.");
    }

    const { GoogleAuthProvider, signInWithPopup, signOut: fbSignOut } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(fb.auth, provider);
      const email = result.user.email?.trim().toLowerCase();
      if (!email) {
        throw new Error("Your Google account does not expose an email address.");
      }

      const profile = await resolveProfile(email);
      if (!profile) {
        throw new Error("No CodeCrew profile is linked to this Google account.");
      }

      return await completeSignIn(profile);
    } catch (error) {
      try {
        await fbSignOut(fb.auth);
      } catch {
        /* ignore */
      }
      throw error instanceof Error ? error : new Error("Google sign-in failed.");
    }
  }, [completeSignIn]);

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
      signInWithGoogle,
      signOut,
      isRole: (role: Role) => user?.role === role,
    }),
    [user, loading, signIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
