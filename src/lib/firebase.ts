import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export interface FirebaseBundle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

const firebaseConfig = {
  apiKey: "AIzaSyDbjZxplN1bBp8axZwjM_hWbAdUqLJc2iw",
  authDomain: "codecrew-5ea8b.firebaseapp.com",
  projectId: "codecrew-5ea8b",
  storageBucket: "codecrew-5ea8b.firebasestorage.app",
  messagingSenderId: "635170138172",
  appId: "1:635170138172:web:048e9fe20074fd45e3bb39",
};

let bundlePromise: Promise<FirebaseBundle | null> | null = null;

/**
 * Lazily boots Firebase in the browser.
 */
export function getFirebase(): Promise<FirebaseBundle | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!bundlePromise) {
    bundlePromise = (async () => {
      try {
        const app = initializeApp(firebaseConfig);
        return {
          app,
          auth: getAuth(app),
          db: getFirestore(app),
          storage: getStorage(app),
        };
      } catch (error) {
        console.warn("[firebase] initialization failed", error);
        return null;
      }
    })();
  }
  return bundlePromise;
}
