import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ChoiceCard, ChoiceGrid } from "@/src/components/choice";
import { Button, PageHead, Screen, SectionLabel, Textarea } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

const TYPES = [
  { title: "App crash", sub: "App closes or freezes" },
  { title: "Wrong info", sub: "Incorrect listing details" },
  { title: "Payment issue", sub: "Boost or promotion problem" },
  { title: "Something else", sub: "Any other issue" },
];

export default function ReportBug() {
  const router = useRouter();
  const { submitBug } = useApp();
  const [type, setType] = useState(TYPES[0].title);
  const [desc, setDesc] = useState("");

  const submit = async () => {
    const ticket = await submitBug(type, desc);
    router.replace(`/bug-submitted?ticket=${encodeURIComponent(ticket)}`);
  };

  return (
    <Screen keyboard header={<PageHead title="Report a bug" onBack={() => router.back()} />}>
      <SectionLabel>What type of issue?</SectionLabel>
      <ChoiceGrid>
        {TYPES.map((t) => (
          <ChoiceCard key={t.title} title={t.title} sub={t.sub} selected={type === t.title} onPress={() => setType(t.title)} testID={`bug-type-${t.title}`} />
        ))}
      </ChoiceGrid>
      <View style={{ marginTop: 16, gap: 12 }}>
        <Textarea value={desc} onChangeText={setDesc} placeholder="Describe what happened, and what you expected instead..." testID="bug-desc" />
        <Button label="Submit report" onPress={submit} testID="bug-submit" />
      </View>
    </Screen>
  );
}
