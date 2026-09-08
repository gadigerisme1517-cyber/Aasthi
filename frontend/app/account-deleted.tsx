import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button, Empty } from "@/src/components/ui";
import { Screen } from "@/src/components/ui";

export default function AccountDeleted() {
  const router = useRouter();
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
        <Empty title="Account deleted" body="Your AASTHI account and data have been removed. We're sorry to see you go." />
        <Button label="Back to AASTHI" onPress={() => router.replace("/auth/login")} style={{ marginTop: 16 }} testID="deleted-back" />
      </View>
    </Screen>
  );
}
