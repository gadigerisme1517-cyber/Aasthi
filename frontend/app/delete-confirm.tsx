import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Button, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function DeleteConfirm() {
  const router = useRouter();
  const { deleteAccount, logout } = useApp();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteAccount();
      router.replace("/account-deleted");
    } catch (e: any) {
      setBusy(false);
      if (e?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Please sign in again",
          "For your security, deleting an account needs a recent sign-in. Sign out, sign back in, then try deleting your account again.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign out now",
              style: "destructive",
              onPress: () => logout().then(() => router.replace("/auth/login")),
            },
          ],
        );
      } else {
        Alert.alert("Could not delete account", "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Screen header={<PageHead title="Delete account" onBack={() => router.back()} />}>
      <View style={styles.danger}>
        <T weight={700} size={17} color={colors.red}>
          This can't be undone
        </T>
        <T weight={500} size={13} color={colors.muted} style={{ marginTop: 10, lineHeight: 19 }}>
          Deleting your account removes your saved properties, listings and profile info from AASTHI permanently.
        </T>
      </View>
      <View style={{ gap: 10, marginTop: 4 }}>
        <Button
          label={busy ? "Deleting…" : "Yes, delete my account"}
          variant="red"
          onPress={onDelete}
          testID="confirm-delete"
        />
        <Button label="Cancel" variant="light" onPress={() => router.back()} testID="cancel-delete" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  danger: {
    marginTop: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.2)",
    backgroundColor: "rgba(180,18,24,0.04)",
    padding: 18,
    marginBottom: 8,
  },
});
