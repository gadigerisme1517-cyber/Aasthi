import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Block, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";

export default function SupportChat() {
  const router = useRouter();

  return (
    <Screen header={<PageHead title="Support" onBack={() => router.back()} />}>
      <Block title="We're here to help" style={{ marginTop: 16 }}>
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 20 }}>
          Send us a message and the AASTHI team will get back to you.
        </T>
      </Block>

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.black]} onPress={() => router.push("/report-bug")} testID="support-message">
          <T weight={900} size={13} color="#fff">
            Send a message
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginVertical: 8 },
  btn: { flex: 1, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  black: { backgroundColor: colors.black },
});
