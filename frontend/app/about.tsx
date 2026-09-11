import { useRouter } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";

import { Block, MenuRow, PageHead, Screen, T } from "@/src/components/ui";
import { APP_VERSION } from "@/src/data/seed";
import { colors } from "@/src/theme";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.aasthi.app";

export default function About() {
  const router = useRouter();

  return (
    <Screen header={<PageHead title="About AASTHI" onBack={() => router.back()} />}>
      <View style={styles.head}>
        <View style={styles.mark}>
          <T weight={900} size={26} color="#fff">
            A
          </T>
        </View>
        <T weight={700} size={24} ls={-1} style={{ marginTop: 12 }}>
          AASTHI
        </T>
        <T weight={500} size={13} color={colors.muted} style={{ marginTop: 6 }}>
          Version {APP_VERSION} · Kurnool, Andhra Pradesh
        </T>
      </View>

      <Block title="Our story">
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 22 }}>
          AASTHI connects buyers, renters and sellers across Kurnool with verified listings, real photography and honest pricing — no clutter, no middlemen games.
        </T>
      </Block>

      <View style={{ marginTop: 14 }}>
        <MenuRow icon="info" title="Terms of Service" onPress={() => router.push("/terms")} testID="about-terms" />
        <MenuRow icon="shield" title="Privacy Policy" onPress={() => router.push("/policy")} testID="about-policy" />
        <MenuRow icon="star" title="Rate AASTHI" onPress={() => Linking.openURL(PLAY_STORE_URL)} testID="about-rate" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", marginTop: 14, marginBottom: 6 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
});
