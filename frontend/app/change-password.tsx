import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen } from "@/src/components/ui";
import { changeOwnPassword, saveUserDoc } from "@/src/services/db";
import { auth } from "@/src/services/firebase";
import { useApp } from "@/src/store/AppContext";

function passwordErrorMessage(code?: string): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect";
    case "auth/weak-password":
      return "Choose a stronger password";
    case "auth/requires-recent-login":
      return "Please sign out and sign back in, then try again";
    case "no-password-account":
      return "Password change isn't available for accounts signed in with Google";
    default:
      return "Could not update password. Please try again";
  }
}

export default function ChangePassword() {
  const router = useRouter();
  const { showToast } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const update = async () => {
    if (busy) return;
    if (!current) {
      showToast("Enter your current password");
      return;
    }
    if (!next || next.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    if (next !== confirm) {
      showToast("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await changeOwnPassword(current, next);
      const uid = auth.currentUser?.uid;
      if (uid) await saveUserDoc(uid, { passwordChangedAt: Date.now() });
      showToast("Password updated");
      router.back();
    } catch (e: any) {
      showToast(passwordErrorMessage(e?.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Change password" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 18 }}>
        <Field value={current} onChangeText={setCurrent} placeholder="Current password" secureTextEntry testID="pw-current" />
        <Field value={next} onChangeText={setNext} placeholder="New password" secureTextEntry testID="pw-new" />
        <Field value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" secureTextEntry testID="pw-confirm" />
        <Button label={busy ? "Updating…" : "Update password"} onPress={update} testID="pw-update" />
      </View>
    </Screen>
  );
}
