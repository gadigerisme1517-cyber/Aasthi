import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function ManualLocation() {
  const router = useRouter();
  const { draft, setDraft, showToast } = useApp();
  const [addr, setAddr] = useState(draft.addr);
  const [geo, setGeo] = useState(draft.geo);

  return (
    <Screen keyboard header={<PageHead title="Property Location" onBack={() => router.back()} />}>
      <T weight={500} size={13} color={colors.muted} style={{ marginTop: 16, marginBottom: 6 }}>
        Enter the property's full address.
      </T>
      <View style={{ gap: 12 }}>
        <Field value={addr} onChangeText={setAddr} placeholder="Address" testID="manual-addr" />
        <Field value={geo} onChangeText={setGeo} placeholder="Coordinates (optional)" testID="manual-geo" />
        <Button
          label="Confirm Location"
          onPress={() => {
            if (!addr.trim()) {
              showToast("Enter the property's address");
              return;
            }
            setDraft({ addr: addr.trim(), geo: geo.trim() });
            router.push("/sell/details");
          }}
          testID="manual-confirm"
        />
      </View>
    </Screen>
  );
}
