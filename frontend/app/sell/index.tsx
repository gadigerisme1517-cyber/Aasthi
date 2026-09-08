import { useRouter } from "expo-router";
import { useState } from "react";

import { ChoiceCard, ChoiceGrid } from "@/src/components/choice";
import { Button, PageHead, Screen, SectionHead } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Sell() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [cat, setCat] = useState(draft.category);

  const options = [
    { title: "Sell Property", sub: "House, plot, villa or commercial listing." },
    { title: "Rent Property", sub: "Residential or commercial rental listing." },
  ];

  return (
    <Screen header={<PageHead title="List Property" onBack={() => router.push("/(tabs)")} />}>
      <SectionHead title="What do you want to list?" sub="Simple seller flow with fewer steps." />
      <ChoiceGrid>
        {options.map((o) => (
          <ChoiceCard
            key={o.title}
            title={o.title}
            sub={o.sub}
            selected={cat === o.title}
            onPress={() => setCat(o.title)}
            testID={`sell-cat-${o.title}`}
          />
        ))}
      </ChoiceGrid>
      <Button
        label="Continue"
        onPress={() => {
          setDraft({ category: cat });
          router.push("/sell/type");
        }}
        style={{ marginTop: 14 }}
        testID="sell-continue"
      />
    </Screen>
  );
}
