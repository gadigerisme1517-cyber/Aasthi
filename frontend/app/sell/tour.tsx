import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function SellTour() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [link, setLink] = useState(draft.tourLink);

  return (
    <Screen keyboard header={<PageHead title="360° tour link" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={link} onChangeText={setLink} placeholder="https://…" testID="tour-link" />
        <Button
          label="Save Tour"
          onPress={() => {
            setDraft({ tourLink: link });
            router.back();
          }}
          testID="tour-save"
        />
      </View>
    </Screen>
  );
}
