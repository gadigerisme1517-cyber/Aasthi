import { useRouter } from "expo-router";

import { Block, PageHead, Screen, T } from "@/src/components/ui";

const SECTIONS = [
  { h: "What we collect", p: "Your name, phone, email and search activity help us show relevant listings and connect you with sellers you contact." },
  { h: "How it's used", p: "We never sell your data. When you enquire, request a number or schedule a visit on a listing, two things happen: your name and your message are sent to that seller, and that seller's phone number is shown to you on the listing. Nothing is exchanged before you contact someone. Your phone number is shown to buyers only on properties you publish yourself, because a listing has to be reachable." },
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
