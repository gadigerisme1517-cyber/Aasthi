import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function DeleteConfirm() {
  const router = useRouter();
  const { deleteAccount } = useApp();

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
          label="Yes, delete my account"
          variant="red"
          onPress={() => {
            deleteAccount();
            router.replace("/account-deleted");
          }}
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
