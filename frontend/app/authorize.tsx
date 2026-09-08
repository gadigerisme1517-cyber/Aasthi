import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/src/store/AppContext";

// OAuth redirect target for native Facebook login (fb<APP_ID>://authorize).
// The actual sign-in is completed by WebBrowser.openAuthSessionAsync's promise
// in src/services/authProviders.ts (still running in the background Login
// screen), which then navigates to the right place itself (tabs or
// profile-setup). This screen must NOT redirect based on auth state the
// instant it mounts — that state hasn't caught up yet. It waits, and stays
// visually minimal (no card/title) so the brief wait doesn't read as a
// separate screen popping up.
export default function Authorize() {
  const router = useRouter();
  const { authed } = useApp();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (authed) {
      router.replace("/");
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, [authed, router]);

  useEffect(() => {
    if (timedOut) router.replace("/auth/login");
  }, [timedOut, router]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#ffffff" />
    </View>
  );
}
