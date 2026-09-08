import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function ChangePassword() {
  const router = useRouter();
  const { showToast } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const update = () => {
    if (!next || next.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    if (next !== confirm) {
      showToast("Passwords don't match");
      return;
    }
    showToast("Password updated");
    router.back();
  };

  return (
    <Screen keyboard header={<PageHead title="Change password" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 18 }}>
        <Field value={current} onChangeText={setCurrent} placeholder="Current password" secureTextEntry testID="pw-current" />
        <Field value={next} onChangeText={setNext} placeholder="New password" secureTextEntry testID="pw-new" />
        <Field value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" secureTextEntry testID="pw-confirm" />
        <Button label="Update password" onPress={update} testID="pw-update" />
      </View>
    </Screen>
  );
}
