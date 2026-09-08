import { useRouter } from "expo-router";
import { useState } from "react";

import { ChoiceCard, ChoiceGrid } from "@/src/components/choice";
import { Button, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

const TYPES = [
  { title: "Independent House", sub: "Owner or broker listing." },
  { title: "Apartment", sub: "Flat or gated community." },
  { title: "Open Plot", sub: "Layout, DTCP or highway land." },
  { title: "Commercial", sub: "Shop, office or warehouse." },
];

export default function SellType() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [type, setType] = useState(draft.propertyType);

  return (
    <Screen header={<PageHead title="Property Type" onBack={() => router.back()} />}>
      <ChoiceGrid>
        {TYPES.map((t) => (
          <ChoiceCard
            key={t.title}
            title={t.title}
            sub={t.sub}
            selected={type === t.title}
            onPress={() => setType(t.title)}
            testID={`sell-type-${t.title}`}
          />
        ))}
      </ChoiceGrid>
      <Button
        label="Continue"
        onPress={() => {
          setDraft({ propertyType: type });
          router.push("/sell/location");
        }}
        style={{ marginTop: 14 }}
        testID="sell-type-continue"
      />
    </Screen>
  );
}
