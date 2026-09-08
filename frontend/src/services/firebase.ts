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
  // Native: AsyncStorage-backed persistence (falls back to memory if unavailable).
  const authMod = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  try {
    auth = authMod.initializeAuth(app, {
      persistence: authMod.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = authMod.getAuth(app);
  }
}

export { auth };
// Force long-polling: the preview proxy aborts Firestore's WebChannel streams.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
