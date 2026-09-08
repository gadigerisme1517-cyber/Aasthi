import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen, SectionHead } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";


export default function ProfileSetup() {
  const router = useRouter();
  const { completeProfile, showToast } = useApp();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Kurnool, Andhra Pradesh");

  const onFinish = async () => {
    completeProfile({
      name: name.trim() || "Guest User",
      city,
      type: "AASTHI member",
    })
      .then(() => {
        showToast("Welcome to AASTHI!");
        router.replace("/(tabs)");
      })
      .catch(() => showToast("Could not save profile — try again"));
  };

  return (
    <Screen
      keyboard
      header={<PageHead title="Set up profile" onBack={() => router.replace("/auth/login")} />}
    >
      <SectionHead title="Tell us about you" sub="This helps sellers respond faster." />
      <View style={{ gap: 12 }}>
        <Field value={name} onChangeText={setName} placeholder="Full name" testID="setup-name" />
        <Field value={city} onChangeText={setCity} placeholder="City" testID="setup-city" />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button label="Enter AASTHI" onPress={onFinish} testID="setup-finish" />
      </View>
    </Screen>
  );
}
