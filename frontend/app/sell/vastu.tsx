import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { SelectChips } from "@/src/components/choice";
import { Button, PageHead, Screen, T, Textarea } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const FACINGS = ["East", "North", "West", "South"];

export default function SellVastu() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [facing, setFacing] = useState(draft.facing);
  const [notes, setNotes] = useState(draft.vastu);

  return (
    <Screen keyboard header={<PageHead title="Vastu" onBack={() => router.back()} />}>
      <T weight={700} size={11} color={colors.faint} ls={0.6} style={{ marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>
        Facing
      </T>
      <SelectChips items={FACINGS} value={facing} onSelect={setFacing} testIDPrefix="vastu-facing" />
      <View style={{ marginTop: 12 }}>
        <Textarea value={notes} onChangeText={setNotes} placeholder="Vastu notes" testID="vastu-notes" />
      </View>
      <Button
        label="Save Vastu"
        onPress={() => {
          setDraft({ facing, vastu: notes });
          router.back();
        }}
        style={{ marginTop: 14 }}
        testID="vastu-save"
      />
    </Screen>
  );
}
