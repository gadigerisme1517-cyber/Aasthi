import { useRouter } from "expo-router";

import { Block, PageHead, Screen, T } from "@/src/components/ui";

const SECTIONS = [
  { h: "Using AASTHI", p: "By using AASTHI you agree to list and browse properties honestly, keep your account details accurate, and respect other users. Listings must represent real, available properties." },
  { h: "Listings & verification", p: "Sellers are responsible for the accuracy of price, area and documentation shown. AASTHI reviews reported listings but does not guarantee every detail." },
  { h: "Account suspension", p: "Accounts found posting fraudulent or duplicate listings may be suspended without notice to protect the community." },
];

export default function Terms() {
  const router = useRouter();
  return (
    <Screen header={<PageHead title="Terms of Service" onBack={() => router.back()} />}>
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
