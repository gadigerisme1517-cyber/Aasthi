// Firebase client init for Expo (works on web preview and native).
// Config comes from EXPO_PUBLIC_FIREBASE_* env vars (never hardcoded).
import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { Auth } from "firebase/auth";
import { Platform } from "react-native";
/* eslint-disable @typescript-eslint/no-require-imports -- platform-conditional firebase/auth loading */

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MSG_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const FIREBASE_ENABLED = !!cfg.apiKey && !!cfg.projectId;

export const app = getApps().length ? getApp() : initializeApp(cfg);

let auth: Auth;
if (Platform.OS === "web") {
  // Web uses default (browserLocal) persistence.
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
} else {
  // Native: AsyncStorage-backed persistence, so a session survives the app
  // being killed, updated or restarted.
  //
  // WHY THE HELPER IS IMPORTED FROM "@firebase/auth" AND NOT "firebase/auth":
  // the umbrella `firebase` package's exports map for "./auth" declares only
  // types / node / browser / default — there is NO "react-native" condition.
  // Metro therefore resolves `firebase/auth` to the BROWSER build, which does
  // not export getReactNativePersistence. Calling it threw a TypeError, the
  // catch below swallowed it, and auth silently fell back to IN-MEMORY
  // persistence — which is why users were signed out by an app update, a
  // force-stop, or the OS reclaiming the process.
  // `@firebase/auth` does declare a "react-native" condition, so importing
  // the helper from there gets the build that actually has it.
  const authMod = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;

  let getRNPersistence: ((s: unknown) => unknown) | undefined;
  try {
    getRNPersistence = require("@firebase/auth").getReactNativePersistence;
  } catch {
    getRNPersistence = undefined;
  }
  // Belt and braces: if a future version restores it on the umbrella package.
  if (typeof getRNPersistence !== "function") {
    getRNPersistence = authMod.getReactNativePersistence;
  }

  if (typeof getRNPersistence !== "function") {
    // Do NOT fail silently the way this used to. Memory-only auth looks fine
    // until the app restarts, which is exactly the bug that hid here.
    console.warn(
      "[auth] getReactNativePersistence unavailable — sessions will NOT survive a restart",
    );
    auth = authMod.initializeAuth(app);
  } else {
    try {
      auth = authMod.initializeAuth(app, { persistence: getRNPersistence(AsyncStorage) });
    } catch {
      // Already initialised (e.g. this module was evaluated twice). getAuth
      // returns that SAME instance, persistence and all — it is not a
      // downgrade to memory.
      auth = authMod.getAuth(app);
    }
  }
}

export { auth };
// Force long-polling: the preview proxy aborts Firestore's WebChannel streams.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
