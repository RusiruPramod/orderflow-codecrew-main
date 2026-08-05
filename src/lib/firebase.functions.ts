import { createServerFn } from "@tanstack/react-start";

/**
 * Firebase web config. The API key is a publishable client key, but it is kept
 * in project secrets and handed to the browser at runtime through this server fn.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = (process.env["GOOGLE_API_KEY"] ?? "").trim();
  return {
    apiKey,
    authDomain: "codecrew-5ea8b.firebaseapp.com",
    projectId: "codecrew-5ea8b",
    storageBucket: "codecrew-5ea8b.firebasestorage.app",
    messagingSenderId: "635170138172",
    appId: "1:635170138172:web:048e9fe20074fd45e3bb39",
    enabled: apiKey.length > 10,
  };
});
