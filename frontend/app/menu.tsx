import { useRouter } from "expo-router";

import { MenuRow, PageHead, Screen, SectionLabel } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";
import { FEATURES } from "@/src/config";

// Everything that used to sit on the old /profile settings list.
//
// The storefront body carries none of it — that was the point of the rebuild —
// so it all moved behind the gear in the storefront's top bar. NOTHING WAS
// DROPPED. Saved and Property Partner are here too: Saved lost its nav slot
// when Enquiries took it, and Property Partner was a quick-action tile, so
// without this screen both would have become unreachable.
//
// "My inquiries" is deliberately NOT here. It is buyer-side and it already has
// its own slot in the bottom nav; putting it behind the agent's gear as well
// would say it belongs to the store, which it does not.

export default function Menu() {
  const router = useRouter();
  const { user, savedSellers } = useApp();

  return (
    <Screen header={<PageHead title="Settings" onBack={() => router.back()} />}>
      <SectionLabel>Store</SectionLabel>
      <MenuRow
        icon="user"
        title="Account"
        sub="Photo, name, phone, email, area and bio"
        onPress={() => router.push("/account")}
        testID="menu-account"
      />
      <MenuRow
        icon="shield"
        title="Get verified"
        sub={user.verified ? "Your store shows the verified check" : "Upload documents for the verified check"}
        onPress={() => router.push("/verify")}
        testID="menu-verify"
      />
      <MenuRow
        icon="shield"
        title="Property Partner"
        sub="Sell professionally on AASTHI"
        onPress={() => router.push("/property-partner")}
        testID="menu-partner"
      />
      {FEATURES.premium ? (
        <MenuRow icon="star" title="Premium" sub="Plans and contact views" onPress={() => router.push("/premium")} testID="menu-premium" />
      ) : null}

      <SectionLabel>Saved</SectionLabel>
      <MenuRow
        icon="heart"
        title="Saved"
        sub={
          savedSellers.length
            ? `Listings you shortlisted and ${savedSellers.length} store${savedSellers.length === 1 ? "" : "s"}`
            : "Listings you shortlisted"
        }
        onPress={() => router.push("/(tabs)/saved")}
        testID="menu-saved"
      />

      <SectionLabel>Notifications and security</SectionLabel>
      {FEATURES.notificationPrefs ? (
        <MenuRow icon="bell" title="Notifications" sub="Alerts, price drops, messages" onPress={() => router.push("/notif-prefs")} testID="menu-notif" />
      ) : null}
      <MenuRow
        icon="shield"
        title="Privacy and security"
        sub="Visibility, data, password"
        onPress={() => router.push("/privacy")}
        testID="menu-privacy"
      />
      <MenuRow
        icon="trash"
        title="Blocked users"
        sub="Stores you blocked"
        onPress={() => router.push("/blocked")}
        testID="menu-blocked"
      />
      <MenuRow icon="gear" title="App settings" sub="Storage and app preferences" onPress={() => router.push("/settings")} testID="menu-settings" />

      <SectionLabel>Support</SectionLabel>
      <MenuRow icon="lifebuoy" title="Help and support" sub="FAQs and report a bug" onPress={() => router.push("/help")} testID="menu-help" />
      <MenuRow icon="info" title="About AASTHI" sub="Version, terms, policy" onPress={() => router.push("/about")} testID="menu-about" />

      <SectionLabel>Session</SectionLabel>
      <MenuRow
        icon="logout"
        title="Sign out"
        sub="You'll need to sign in again"
        danger
        onPress={() => router.push("/logout-confirm")}
        testID="menu-logout"
      />
    </Screen>
  );
}
