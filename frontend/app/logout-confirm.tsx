import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function LogoutConfirm() {
  const router = useRouter();
  const { logout } = useApp();

  return (
    <Screen header={<PageHead title="Log out" onBack={() => router.back()} />}>
      <Empty title="Log out of AASTHI?" body="You'll need to sign in again to save properties or message sellers." />
      <View style={{ gap: 10, marginTop: 16 }}>
        <Button
          label="Log out"
          variant="red"
          onPress={() => {
            logout();
            router.replace("/logged-out");
          }}
          testID="confirm-logout"
        />
        <Button label="Cancel" variant="light" onPress={() => router.back()} testID="cancel-logout" />
      </View>
    </Screen>
  );
}
