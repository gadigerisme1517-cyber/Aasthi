import { useRouter } from "expo-router";

import { PageHead, Screen, SectionLabel, ToggleRow } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function NotifPrefs() {
  const router = useRouter();
  const { settings, setSetting } = useApp();

  return (
    <Screen header={<PageHead title="Notifications" onBack={() => router.back()} />}>
      <SectionLabel>Push notifications</SectionLabel>
      <ToggleRow title="New matching listings" sub="Properties that match your saved searches" value={settings.pushNew} onChange={() => setSetting("pushNew", !settings.pushNew)} testID="toggle-pushNew" />
      <ToggleRow title="Price drop alerts" sub="When a saved property reduces price" value={settings.pushPrice} onChange={() => setSetting("pushPrice", !settings.pushPrice)} testID="toggle-pushPrice" />
      <ToggleRow title="Messages from sellers" sub="Replies to your enquiries and visits" value={settings.pushMsg} onChange={() => setSetting("pushMsg", !settings.pushMsg)} testID="toggle-pushMsg" />
      <ToggleRow title="Promotions & offers" sub="AASTHI news and festive offers" value={settings.pushPromo} onChange={() => setSetting("pushPromo", !settings.pushPromo)} testID="toggle-pushPromo" />
      <SectionLabel>Email</SectionLabel>
      <ToggleRow title="Weekly property digest" sub="A curated list of new Kurnool listings" value={settings.emailUpdates} onChange={() => setSetting("emailUpdates", !settings.emailUpdates)} testID="toggle-emailUpdates" />
    </Screen>
  );
}
