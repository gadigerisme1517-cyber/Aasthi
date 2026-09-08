import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { SelectChips } from "@/src/components/choice";
import { Button, Field, PageHead, Screen, T, Textarea } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const UNITS = ["Square Feet", "Square Yards", "Cents", "Acres"];

export default function SellDetails() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [price, setPrice] = useState(draft.price);
  const [unit, setUnit] = useState(draft.areaUnit);
  const [area, setArea] = useState(draft.area);
  const [desc, setDesc] = useState(draft.desc);

  return (
    <Screen keyboard header={<PageHead title="Property Details" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={price} onChangeText={setPrice} placeholder="Price" testID="details-price" />
        <View>
          <T weight={800} size={11} color={colors.faint} ls={0.6} style={{ marginBottom: 8, textTransform: "uppercase" }}>
            Area unit
          </T>
          <SelectChips items={UNITS} value={unit} onSelect={setUnit} testIDPrefix="details-unit" />
        </View>
        <Field value={area} onChangeText={setArea} placeholder="Area" testID="details-area" />
        <Textarea value={desc} onChangeText={setDesc} placeholder="Describe the property" testID="details-desc" />
        <Button
          label="Continue"
          onPress={() => {
            setDraft({ price, areaUnit: unit, area, desc });
            router.push("/sell/photos");
          }}
          testID="details-continue"
        />
      </View>
    </Screen>
  );
}
