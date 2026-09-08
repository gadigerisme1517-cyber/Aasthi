import { useRouter } from "expo-router";

import { Block, PageHead, Screen, T } from "@/src/components/ui";

const SECTIONS = [
  { h: "What we collect", p: "Your name, phone, email and search activity help us show relevant listings and connect you with sellers you contact." },
  { h: "How it's used", p: "We never sell your data. Contact details are shared only with a seller once you enquire, call or schedule a visit on a listing." },
  { h: "Your controls", p: "You can update visibility and notification preferences anytime in Privacy settings, or delete your account entirely from Account settings." },
];

export default function Policy() {
  const router = useRouter();
  return (
    <Screen header={<PageHead title="Privacy Policy" onBack={() => router.back()} />}>
      {SECTIONS.map((s, i) => (
        <Block key={s.h} title={s.h} style={i === 0 ? { marginTop: 16 } : undefined}>
          <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 22 }}>
            {s.p}
          </T>
        </Block>
      ))}
    </Screen>
  );
}
