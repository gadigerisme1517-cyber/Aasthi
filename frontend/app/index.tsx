import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { colors, font } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function Index() {
  const { booted, authed } = useApp();

  if (!booted) {
    return (
      <View style={styles.splash} testID="splash-screen">
        <View style={styles.mark}>
          <T weight={700} size={30} color={colors.black}>
            A
          </T>
        </View>
        <T weight={700} size={22} color={colors.white} ls={4} style={{ marginTop: 20 }}>
          AASTHI
        </T>
        <T weight={600} size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 8 }}>
          Simple property marketplace
        </T>
      </View>
    );
  }

  return <Redirect href={authed ? "/(tabs)" : "/auth/login"} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
