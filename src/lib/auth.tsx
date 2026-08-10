import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getFirebase } from "./firebase";
import { listUsers, logActivity, seedFirestore } from "./db";
import { seedUsers } from "./seed";
import type { AppUser, Role } from "./types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  firebaseReady: boolean;
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

async function resolveProfile(email: string): Promise<AppUser | null> {
  const normalized = email.trim().toLowerCase();

  try {
    const users = await listUsers();
    return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      return seedUsers.find((user) => user.email.toLowerCase() === normalized) ?? null;
    }
    throw error;
  }
}

function isFirebaseAuthError(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function isFirebasePermissionError(error: unknown): error is { code?: string } {
  return isFirebaseAuthError(error) && error.code === "permission-denied";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => readStoredSession());
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const seededRef = useRef(false);

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

    try {
      await seedFirestore();
      seededRef.current = true;
    } catch (error) {
      console.warn("[auth] firestore seed failed", error);
    }

    return profile;
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setUser(stored);
    }
  }, []);

  useEffect(() => {
    if (!user || !firebaseReady || seededRef.current) return;
    seededRef.current = true;

    void seedFirestore().catch((error) => {
      console.warn("[auth] firestore seed failed", error);
    });
  }, [user, firebaseReady]);

  useEffect(() => {
    let canceled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const fb = await getFirebase();
      if (!fb) {
        if (!canceled) {
          setFirebaseReady(true);
          setLoading(false);
        }
        return;
      }

      const { onAuthStateChanged } = await import("firebase/auth");
      unsubscribe = onAuthStateChanged(fb.auth, async (firebaseUser) => {
        if (canceled) return;

        if (!firebaseUser) {
          setUser(null);
        } else if (firebaseUser.isAnonymous) {
          // Keep the existing CodeCrew profile session active while Firebase is using
          // anonymous auth for Firestore or storage access.
        } else if (firebaseUser.email) {
          const profile = await resolveProfile(firebaseUser.email);
          setUser(profile);
        } else {
          setUser(null);
        }

        setFirebaseReady(true);
        setLoading(false);
      });
    })();

    return () => {
      canceled = true;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const fb = await getFirebase();

    if (!fb) {
      throw new Error("Firebase is not available. Please check your configuration.");
    }

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(fb.auth, normalized, password);
    } catch (error) {
      if (
        isFirebaseAuthError(error) &&
        (error.code === "auth/user-not-found" || error.code === "auth/user-disabled") &&
        password === DEMO_PASSWORD
      ) {
        try {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          await createUserWithEmailAndPassword(fb.auth, normalized, password);
        } catch (createError) {
          console.warn("[auth] firebase user creation failed", createError);
          throw new Error("Unable to sign in to Firebase. Please try again.");
        }
      } else {
        console.warn("[auth] firebase sign-in unavailable", error);
        throw new Error("Invalid email or password.");
      }
    }

    const profile = await resolveProfile(normalized);
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

      await seedFirestore();
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
      firebaseReady,
      signIn,
      signInWithGoogle,
      signOut,
      isRole: (role: Role) => user?.role === role,
    }),
    [user, loading, firebaseReady, signIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
