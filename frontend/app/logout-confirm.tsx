import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function LogoutConfirm() {
  const router = useRouter();
  const { logout } = useApp();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      router.replace("/logged-out");
    } catch {
      setBusy(false);
      Alert.alert("Could not log out", "Something went wrong. Please try again.");
    }
  };

  return (
    <Screen header={<PageHead title="Log out" onBack={() => router.back()} />}>
      <Empty title="Log out of AASTHI?" body="You'll need to sign in again to save properties or message sellers." />
      <View style={{ gap: 10, marginTop: 16 }}>
        <Button label={busy ? "Logging out…" : "Log out"} variant="red" onPress={onLogout} testID="confirm-logout" />
        <Button label="Cancel" variant="light" onPress={() => router.back()} testID="cancel-logout" />
      </View>
    </Screen>
  );
}
