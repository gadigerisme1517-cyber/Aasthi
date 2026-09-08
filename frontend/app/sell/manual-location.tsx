import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function ManualLocation() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [addr, setAddr] = useState(draft.addr);
  const [geo, setGeo] = useState(draft.geo);

  return (
    <Screen keyboard header={<PageHead title="Change location" onBack={() => router.back()} />}>
      <T weight={500} size={13} color={colors.muted} style={{ marginTop: 16, marginBottom: 6 }}>
        Search powered by Google Places on the installed build.
      </T>
      <View style={{ gap: 12 }}>
        <Field value={addr} onChangeText={setAddr} placeholder="Address" testID="manual-addr" />
        <Field value={geo} onChangeText={setGeo} placeholder="Coordinates" testID="manual-geo" />
        <Button
          label="Confirm location"
          onPress={() => {
            setDraft({ addr, geo });
            router.push("/sell/details");
          }}
          testID="manual-confirm"
        />
      </View>
    </Screen>
  );
}
