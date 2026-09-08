import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { Platform } from "react-native";

import { auth } from "@/src/services/firebase";

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "58983588171-nm68dsc3ppeo3rh65eb0u3p5t473r9j5.apps.googleusercontent.com";

// No WebBrowser.maybeCompleteAuthSession() here: that existed only to close the
// expo-web-browser redirect session used by the removed Facebook OAuth flow.
// Native Google uses the @react-native-google-signin SDK and web Google uses
// Firebase's signInWithPopup, neither of which needs a redirect session.

if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

export async function googleSignIn() {
  if (Platform.OS === "web") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type !== "success" || !result.data.idToken) {
    const err: any = new Error("Google sign-in cancelled");
    err.code = statusCodes.SIGN_IN_CANCELLED;
    throw err;
  }
  return googleSignInWithIdToken(result.data.idToken);
}

export async function googleSignInWithIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

function authErrorDetails(error?: unknown) {
  const value = error as any;
  const code = typeof error === "string" ? error : value?.code;
  const message = typeof error === "string" ? "" : value?.message;
  const details = [code ? `code: ${code}` : "", message ? `message: ${message}` : ""]
    .filter(Boolean)
    .join("\n");
  return { code, details };
}

export function googleErrorMessage(error?: unknown): string {
  const { code, details } = authErrorDetails(error);
  let base: string;
  switch (code) {
    case "auth/unauthorized-domain":
      base = "This domain is not authorized in Firebase yet";
      break;
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case statusCodes.SIGN_IN_CANCELLED:
      base = "Sign-in cancelled";
      break;
    case "native-unconfigured":
      base = "Google login needs native OAuth setup";
      break;
    case "missing-google-client-id":
      base = "Google login needs Google OAuth client ID";
      break;
    default:
      base = "Google sign-in failed";
  }
  return details ? `${base}\n${details}` : base;
}



