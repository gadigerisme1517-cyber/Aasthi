import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, PageHead, Screen, T } from "@/src/components/ui";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function Boost() {
  const router = useRouter();
  const { showToast } = useApp();

  return (
    <Screen header={<PageHead title="Promote Listing" onBack={() => router.push("/(tabs)")} />}>
      <View style={styles.spot}>
        <T weight={900} size={10} color="#b9b9b9" ls={1.4} style={{ textTransform: "uppercase" }}>
          Property Promotion
        </T>
        <T weight={700} size={21} color="#fff" ls={-1} style={{ marginTop: 8 }}>
          Get more views on your listing.
        </T>
        <T weight={500} size={13} color="#c7c7c7" style={{ marginTop: 7, lineHeight: 19 }}>
          Your property can appear higher in search and the home page as a promoted listing.
        </T>
      </View>

      <View style={styles.plan}>
        <View style={{ flex: 1 }}>
          <T weight={700} size={16}>
            7-day Boost
          </T>
          <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4 }}>
            Top placement · UPI & cards via Razorpay
          </T>
        </View>
        <T weight={900} size={22} ls={-1}>
          ₹499
        </T>
      </View>

      <Button
        label="Pay with Razorpay"
        onPress={() => showToast("Razorpay test keys pending — add keys to enable checkout")}
        style={{ marginTop: 14 }}
        testID="boost-pay"
      />
      <Button label="Done" variant="light" onPress={() => router.push("/(tabs)")} style={{ marginTop: 10 }} testID="boost-done" />

      <T weight={500} size={11.5} color={colors.faint} style={{ textAlign: "center", marginTop: 14, lineHeight: 17 }}>
        Full Razorpay checkout (test mode) activates once your API keys are added to the app configuration.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spot: {
    borderRadius: radius.card,
    padding: 18,
    backgroundColor: "#111",
    marginTop: 18,
    ...shadow.strong,
  },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 14,
    ...shadow.soft,
  },
});
