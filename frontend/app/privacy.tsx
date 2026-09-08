import { useRouter } from "expo-router";

import { MenuRow, PageHead, Screen, SectionLabel, ToggleRow } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Privacy() {
  const router = useRouter();
  const { settings, setSetting } = useApp();

  return (
    <Screen header={<PageHead title="Privacy" onBack={() => router.back()} />}>
      <SectionLabel>Visibility</SectionLabel>
      <ToggleRow title="Public profile" sub="Sellers can see your buyer profile" value={settings.profileVisible} onChange={() => setSetting("profileVisible", !settings.profileVisible)} testID="toggle-profileVisible" />
      <ToggleRow title="Show contact to sellers" sub="Phone number visible after enquiry" value={settings.showContact} onChange={() => setSetting("showContact", !settings.showContact)} testID="toggle-showContact" />
      <ToggleRow title="Personalised recommendations" sub="Use your activity to suggest listings" value={settings.personalized} onChange={() => setSetting("personalized", !settings.personalized)} testID="toggle-personalized" />
      <ToggleRow title="Show activity status" sub="Let sellers see when you're active" value={settings.activityStatus} onChange={() => setSetting("activityStatus", !settings.activityStatus)} testID="toggle-activityStatus" />
      <SectionLabel>Security</SectionLabel>
      <MenuRow icon="shield" title="Change password" sub="Last changed 3 months ago" onPress={() => router.push("/change-password")} testID="privacy-change-password" />
      <MenuRow icon="trash" title="Blocked sellers" sub="Manage who can contact you" onPress={() => router.push("/blocked")} testID="privacy-blocked" />
    </Screen>
  );
}
