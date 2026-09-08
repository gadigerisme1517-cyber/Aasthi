import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { Platform } from "react-native";

import { auth } from "@/src/services/firebase";

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "58983588171-nm68dsc3ppeo3rh65eb0u3p5t473r9j5.apps.googleusercontent.com";
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "855947210672662";

WebBrowser.maybeCompleteAuthSession();

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

export async function facebookSignIn() {
  if (Platform.OS === "web") {
    const provider = new FacebookAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }
  if (!FACEBOOK_APP_ID) {
    const err: any = new Error("Missing Facebook app ID");
    err.code = "missing-facebook-app-id";
    throw err;
  }

  const redirectUri = "aasthi://authorize";
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "public_profile",
    display: "touch",
  });
  const result = await WebBrowser.openAuthSessionAsync(
    `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`,
    redirectUri,
  );
  if (result.type !== "success" || !result.url) {
    const err: any = new Error("Facebook sign-in cancelled");
    err.code = result.type === "cancel" ? "auth/cancelled-popup-request" : "facebook-token-missing";
    throw err;
  }
  const raw = result.url.includes("#") ? result.url.split("#")[1] : result.url.split("?")[1];
  const accessToken = raw ? new URLSearchParams(raw).get("access_token") : null;
  if (!accessToken) {
    const err: any = new Error("Facebook did not return a login token");
    err.code = "facebook-token-missing";
    throw err;
  }
  const credential = FacebookAuthProvider.credential(accessToken);
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

export function googleErrorMessage(code?: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase yet";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case statusCodes.SIGN_IN_CANCELLED:
      return "Sign-in cancelled";
    case "native-unconfigured":
      return "Google login needs native OAuth setup";
    case "missing-google-client-id":
      return "Google login needs Google OAuth client ID";
    default:
      return "Google sign-in failed. Please try again";
  }
}

export function facebookErrorMessage(code?: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase yet";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in cancelled";
    case "facebook-token-missing":
      return "Facebook did not return a login token";
    case "native-unconfigured":
      return "Facebook login needs native OAuth setup";
    case "missing-facebook-app-id":
      return "Facebook login needs Facebook app ID";
    default:
      return "Facebook sign-in failed. Please try again";
  }
}


