import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Block, Button, PageHead, Screen, SectionLabel, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const BENEFITS = [
  "More seller contact number views",
  "Priority inquiries in seller inbox",
  "Unlimited saved properties",
  "New listing and price alerts",
];

const PLANS = [
  { name: "Premium", price: "₹99", term: "per month", views: 15 },
  { name: "Premium Plus", price: "₹249", term: "for 3 months", views: 60 },
];

export default function Premium() {
  const router = useRouter();
  const { user, updateAccount, showToast } = useApp();
  const active = Boolean((user as any).premium);

  const choose = (plan: (typeof PLANS)[number]) => {
    updateAccount({ premium: true, premiumPlan: plan.name, contactViewsRemaining: plan.views } as any).then(() => {
      showToast(`${plan.name} activated`);
      router.back();
    });
  };

  return (
    <Screen header={<PageHead title="AASTHI Premium" onBack={() => router.back()} />}>
      <Block style={{ marginTop: 14 }}>
        <T weight={700} size={22} ls={-0.8}>
          Serious buyer access
        </T>
        <T weight={500} size={13} color={colors.muted} style={{ marginTop: 8, lineHeight: 20 }}>
          Send inquiries for free. Premium adds more contact number views and priority inquiries. Seller privacy still applies.
        </T>
        {active ? (
          <View style={styles.activeBox}>
            <Icon name="check" size={17} color={colors.green} />
            <T weight={700} size={13} color={colors.green}>
              {(user as any).premiumPlan} active · {(user as any).contactViewsRemaining ?? 0} views left
            </T>
          </View>
        ) : null}
      </Block>

      <SectionLabel>Plans</SectionLabel>
      <View style={{ gap: 10 }}>
        {PLANS.map((plan) => (
          <Pressable key={plan.name} style={styles.plan} onPress={() => choose(plan)} testID={`premium-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <View style={{ flex: 1 }}>
              <T weight={700} size={16}>{plan.name}</T>
              <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4 }}>{plan.views} contact number views</T>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <T weight={700} size={19}>{plan.price}</T>
              <T weight={700} size={10.5} color={colors.muted}>{plan.term}</T>
            </View>
          </Pressable>
        ))}
      </View>

      <SectionLabel>Included</SectionLabel>
      <View style={{ gap: 8 }}>
        {BENEFITS.map((b) => (
          <View key={b} style={styles.benefit}>
            <Icon name="check" size={15} color={colors.green} />
            <T weight={700} size={13}>{b}</T>
          </View>
        ))}
      </View>

      <Button label="Back to profile" variant="light" onPress={() => router.back()} style={{ marginTop: 16 }} testID="premium-back" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeBox: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(30,140,80,0.08)", borderRadius: 16, padding: 12 },
  plan: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.result, padding: 15, ...shadow.soft },
  benefit: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 12 },
});
