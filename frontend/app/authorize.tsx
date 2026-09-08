import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";

import { Empty, Screen } from "@/src/components/ui";
import { auth } from "@/src/services/firebase";
import { getUserDoc } from "@/src/services/db";

function tokenFromUrl(url: string | null) {
  if (!url) return "";
  const raw = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
  if (!raw) return "";
  return new URLSearchParams(raw).get("access_token") ?? "";
}

export default function Authorize() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing Facebook sign-in...");

  useEffect(() => {
    let mounted = true;
    Linking.getInitialURL()
      .then(async (url) => {
        const token = tokenFromUrl(url);
        if (!token) throw new Error("Facebook did not return a login token");
        const cred = await signInWithCredential(auth, FacebookAuthProvider.credential(token));
        const existing = await getUserDoc(cred.user.uid);
        if (!mounted) return;
        router.replace(existing?.setup ? "/(tabs)" : "/auth/profile-setup");
      })
      .catch(() => {
        if (!mounted) return;
        setMessage("Facebook sign-in could not finish. Please try again.");
        setTimeout(() => router.replace("/auth/login"), 1200);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <Screen scroll={false} dark>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
        <Empty title="Facebook login" body={message} />
      </View>
    </Screen>
  );
}
