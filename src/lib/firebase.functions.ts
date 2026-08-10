import { createServerFn } from "@tanstack/react-start";

/**
 * Firebase web config. The API key is a publishable client key, but it is kept
 * in project secrets and handed to the browser at runtime through this server fn.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = (
    process.env["GOOGLE_API_KEY"] ??
    process.env["VITE_GOOGLE_API_KEY"] ??
    "AIzaSyDbjzplN1bBp8axZwjM_hWbAdUqLJc2iw"
  ).trim();
  const authDomain = process.env["FIREBASE_AUTH_DOMAIN"] ?? "codecrew-5ea8b.firebaseapp.com";
  const projectId = process.env["FIREBASE_PROJECT_ID"] ?? "codecrew-5ea8b";
  const storageBucket = process.env["FIREBASE_STORAGE_BUCKET"] ?? "codecrew-5ea8b.firebasestorage.app";
  const messagingSenderId = process.env["FIREBASE_MESSAGING_SENDER_ID"] ?? "635170138172";
  const appId = process.env["FIREBASE_APP_ID"] ?? "1:635170138172:web:048e9fe20074fd45e3bb39";

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    enabled: apiKey.length > 10,
  };
});
