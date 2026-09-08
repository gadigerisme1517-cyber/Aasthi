import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button, Empty, Screen } from "@/src/components/ui";

export default function LoggedOut() {
  const router = useRouter();
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
        <Empty title="You're logged out" body="Sign back in to pick up right where you left off." />
        <Button label="Log back in" onPress={() => router.replace("/auth/login")} style={{ marginTop: 16 }} testID="login-again" />
      </View>
    </Screen>
  );
}
