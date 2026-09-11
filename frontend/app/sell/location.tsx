import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Block, Button, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function SellLocation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft } = useApp();

  return (
    <Screen
      header={<PageHead title="Location" onBack={() => router.back()} />}
      footer={
        <View style={[styles.dock, { paddingBottom: insets.bottom + 12 }]}>
          <Button label="Enter Address" onPress={() => router.push("/sell/manual-location")} style={{ flex: 1 }} testID="sell-loc-use" />
        </View>
      }
    >
      <Block title="Property Location" style={{ marginTop: 18 }}>
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 20 }}>
          Enter the property's address on the next screen.
        </T>
        <View style={styles.mapBox}>
          <View style={styles.pin}>
            <T weight={700} size={11} color="#fff">
              {draft.addr || "Set your property address"}
            </T>
          </View>
        </View>
      </Block>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 150,
    borderRadius: 26,
    backgroundColor: "#efefed",
    marginTop: 13,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  pin: { backgroundColor: "#111", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  dock: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: colors.screen,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
