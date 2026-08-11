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
const SESSION_KEY = "codecrew:session"; // using localStorage
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
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function resolveProfile(email: string): Promise<AppUser | null> {
  const normalized = email.trim().toLowerCase();
  const seededProfile = seedUsers.find((user) => user.email.toLowerCase() === normalized);
  if (seededProfile) return seededProfile;

  try {
    const users = await listUsers();
    return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      return null;
    }
    throw error;
  }
}

const seededCredentialMap: Record<string, string> = {
  "rusirupramod@gmail.com": "Rusiru764",
  "malakathushan@gmail.com": "Malaka581",
};

function isSeededCredential(email: string, password: string) {
  return seededCredentialMap[email] === password;
}

function isFirebaseAuthError(error: unknown): error is { code?: string; message?: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function isFirebasePermissionError(error: unknown): error is { code?: string } {
  return isFirebaseAuthError(error) && error.code === "permission-denied";
}

function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!isFirebaseAuthError(error)) return "Authentication failed. Please try again.";

  switch (error.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled in Firebase. Enable it in the Firebase console.";
    case "auth/admin-restricted-operation":
      return "Firebase authentication is restricted for this project. Check the Firebase API key and authentication configuration.";
    case "auth/email-already-in-use":
      return "This email is already registered with another sign-in provider. Try Google sign-in or create a matching email/password account in Firebase.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid or unauthorized. Please verify your Firebase setup.";
    case "auth/unauthorized-domain":
      return "This app domain is not authorized for Firebase Authentication. Add the domain in Firebase console.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Google sign-in was blocked by your browser.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
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
    const profile = await resolveProfile(normalized);
    if (!profile) throw new Error("No CodeCrew profile is linked to this account.");

    const fb = await getFirebase();
    if (!fb) {
      if (isSeededCredential(normalized, password)) {
        console.warn("[auth] Firebase unavailable; signing in locally with seeded credentials.");
        return completeSignIn(profile);
      }
      throw new Error("Firebase is not available. Please check your configuration.");
    }

    if (isSeededCredential(normalized, password)) {
      try {
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
        try {
          await signInWithEmailAndPassword(fb.auth, normalized, password);
        } catch (error) {
          if (
            isFirebaseAuthError(error) &&
            (error.code === "auth/user-not-found" || error.code === "auth/user-disabled")
          ) {
            await createUserWithEmailAndPassword(fb.auth, normalized, password);
          } else if (isFirebaseAuthError(error)) {
            console.warn("[auth] seeded email/password failed; using local seeded profile instead", error);
            return completeSignIn(profile);
          } else {
            throw error;
          }
        }

        return completeSignIn(profile);
      } catch (error) {
        console.warn("[auth] seeded firebase sign-in failed; using local seeded profile", error);
        return completeSignIn(profile);
      }
    }

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(fb.auth, normalized, password);
    } catch (error) {
      console.warn("[auth] firebase sign-in unavailable", error);
      throw new Error(getFirebaseAuthErrorMessage(error));
    }

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
      if (isFirebaseAuthError(error)) {
        throw new Error(getFirebaseAuthErrorMessage(error));
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
