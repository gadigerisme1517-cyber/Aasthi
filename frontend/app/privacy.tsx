import { useRouter } from "expo-router";

import { MenuRow, PageHead, Screen, SectionLabel, ToggleRow } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

function passwordChangedLabel(ts?: number): string {
  if (!ts) return "Not changed since you signed up";
  const days = Math.floor((Date.now() - ts) / (24 * 3600 * 1000));
  if (days <= 0) return "Last changed today";
  if (days === 1) return "Last changed yesterday";
  if (days < 30) return `Last changed ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Last changed ${months} month${months > 1 ? "s" : ""} ago`;
}

export default function Privacy() {
  const router = useRouter();
  const { settings, setSetting, user } = useApp();

  return (
    <Screen header={<PageHead title="Privacy" onBack={() => router.back()} />}>
      <SectionLabel>Visibility</SectionLabel>
      <ToggleRow title="Public profile" sub="Sellers can see your buyer profile" value={settings.profileVisible} onChange={() => setSetting("profileVisible", !settings.profileVisible)} testID="toggle-profileVisible" />
      {/* This one is now live: with it on, an inquiry carries the buyer's
          number so the seller can call back; with it off, the seller sees
          "No number shared". AppContext.addLead is the only place that reads
          it. */}
      <ToggleRow title="Show contact to sellers" sub="Your phone number is sent with your inquiries" value={settings.showContact} onChange={() => setSetting("showContact", !settings.showContact)} testID="toggle-showContact" />
      <ToggleRow title="Personalised recommendations" sub="Use your activity to suggest listings" value={settings.personalized} onChange={() => setSetting("personalized", !settings.personalized)} testID="toggle-personalized" />
      <ToggleRow title="Show activity status" sub="Let sellers see when you're active" value={settings.activityStatus} onChange={() => setSetting("activityStatus", !settings.activityStatus)} testID="toggle-activityStatus" />
      <SectionLabel>Security</SectionLabel>
      <MenuRow icon="shield" title="Change password" sub={passwordChangedLabel(user.passwordChangedAt)} onPress={() => router.push("/change-password")} testID="privacy-change-password" />
      <MenuRow icon="trash" title="Blocked sellers" sub="Manage who can contact you" onPress={() => router.push("/blocked")} testID="privacy-blocked" />
    </Screen>
  );
}
