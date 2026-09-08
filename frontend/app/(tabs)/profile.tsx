import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Block,
  MenuRow,
  PageHead,
  Screen,
  SectionLabel,
  T,
  TrustTag,
} from "@/src/components/ui";
import { Icon, IconName } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";
import { FEATURES } from "@/src/config";

function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "gold" }) {
  const color = tone === "good" ? colors.green : tone === "gold" ? colors.gold : colors.ink;
  return (
    <View style={styles.statusPill}>
      <T weight={850} size={10.5} color={color} numberOfLines={1}>
        {label}
      </T>
    </View>
  );
}

function QuickAction({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable style={styles.action} onPress={onPress} testID={testID}>
      <Icon name={icon} size={17} color={colors.ink} />
      <T weight={850} size={11.5} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user } = useApp();
  const premium = Boolean((user as any).premium);
  const partnerStatus = (user as any).partnerStatus;
  const city = user.city.split(",")[0];

  return (
    <Screen header={<PageHead title="Profile" onBack={() => router.push("/(tabs)")} />}>
      <Block style={{ marginTop: 8 }}>
        <View style={styles.headerRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <T weight={800} size={18} ls={-0.5} numberOfLines={1}>
              {user.name || "AASTHI member"}
            </T>
            <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }} numberOfLines={1}>
              AASTHI member - {city}
            </T>
          </View>
          {user.verified ? <TrustTag label="Verified" /> : null}
        </View>

        <View style={styles.statusRow}>
          <StatusPill label={premium ? ((user as any).premiumPlan || "Premium") : "Free"} tone={premium ? "gold" : "neutral"} />
          <StatusPill label={user.verified ? "Verified" : "Not verified"} tone={user.verified ? "good" : "neutral"} />
          {partnerStatus && partnerStatus !== "none" ? <StatusPill label="Partner pending" tone="gold" /> : null}
        </View>

        <View style={styles.actionGrid}>
          <QuickAction icon="heart" label="Saved" onPress={() => router.push("/(tabs)/saved")} testID="profile-saved" />
          <QuickAction icon="plus" label="List" onPress={() => router.push("/sell")} testID="profile-list" />
          {FEATURES.premium ? (
            <QuickAction icon="star" label="Premium" onPress={() => router.push("/premium")} testID="profile-premium" />
          ) : null}
          <QuickAction icon="shield" label="Partner" onPress={() => router.push("/property-partner")} testID="profile-partner" />
        </View>
      </Block>

      <SectionLabel>Account</SectionLabel>
      <MenuRow icon="user" title="Account" sub="Name, phone, email, city" onPress={() => router.push("/account")} testID="menu-account" />
      <MenuRow icon="shield" title="Get verified" sub="Upload documents for a Verified badge" onPress={() => router.push("/verify")} testID="menu-verify" />
      {FEATURES.notificationPrefs ? (
        <MenuRow icon="bell" title="Notifications" sub="Alerts, price drops, messages" onPress={() => router.push("/notif-prefs")} testID="menu-notif" />
      ) : null}
      <MenuRow icon="shield" title="Privacy" sub="Visibility, data, password" onPress={() => router.push("/privacy")} testID="menu-privacy" />
      <MenuRow icon="gear" title="Settings" sub="Storage and app preferences" onPress={() => router.push("/settings")} testID="menu-settings" />

      <SectionLabel>Support</SectionLabel>
      <MenuRow icon="lifebuoy" title="Help & Support" sub="FAQs and report a bug" onPress={() => router.push("/help")} testID="menu-help" />
      <MenuRow icon="info" title="About AASTHI" sub="Version, terms, policy" onPress={() => router.push("/about")} testID="menu-about" />

      <SectionLabel>Session</SectionLabel>
      <MenuRow icon="logout" title="Log out" sub="You'll need to sign in again" danger onPress={() => router.push("/logout-confirm")} testID="menu-logout" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  statusPill: {
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  action: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    ...shadow.soft,
  },
});

