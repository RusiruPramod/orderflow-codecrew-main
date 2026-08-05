import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseConfig } from "./firebase.functions";

export interface FirebaseBundle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let bundlePromise: Promise<FirebaseBundle | null> | null = null;

/**
 * Lazily boots Firebase in the browser. Returns null when no valid API key is
 * configured — the app then runs on the local demo data layer instead.
 */
export function getFirebase(): Promise<FirebaseBundle | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!bundlePromise) {
    bundlePromise = (async () => {
      try {
        const config = await getFirebaseConfig();
        if (!config.enabled) return null;
        const app = initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        });
        return {
          app,
          auth: getAuth(app),
          db: getFirestore(app),
          storage: getStorage(app),
        };
      } catch (error) {
        console.warn("[firebase] falling back to local data layer", error);
        return null;
      }
    })();
  }
  return bundlePromise;
}
