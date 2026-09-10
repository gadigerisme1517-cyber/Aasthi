import { useRouter } from "expo-router";
import { View } from "react-native";

import { Block, Empty, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function Notifications() {
  const router = useRouter();
  const { notifications } = useApp();

  return (
    <Screen header={<PageHead title="Notifications" onBack={() => router.back()} />}>
      {notifications.length ? (
        <View style={{ gap: 8, marginTop: 14 }}>
          {notifications.map((n) => (
            <Block key={n.id} title={n.title}>
              <T weight={500} size={14} color={colors.muted} style={{ lineHeight: 20 }}>
                {n.body}
              </T>
            </Block>
          ))}
        </View>
      ) : (
        <Empty title="No notifications yet" body="Inquiries, seller replies and alerts will appear here." />
      )}
    </Screen>
  );
}
