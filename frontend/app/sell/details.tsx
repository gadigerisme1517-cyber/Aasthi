import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { SelectChips } from "@/src/components/choice";
import { Button, Field, PageHead, Screen, T, Textarea } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const UNITS = ["Square Feet", "Square Yards", "Cents", "Acres"];
const UNIT_SUFFIX: Record<string, string> = {
  "Square Feet": "sq.ft",
  "Square Yards": "sq.yd",
  Cents: "cents",
  Acres: "acres",
};

// The unit picker owns the suffix. Strip one that is already present so a
// re-entered draft (draft.area repopulates this field) or a hand-typed
// "2240 sq.ft" cannot produce "2240 sq.ft sq.ft".
function bareArea(value: string) {
  const s = value.trim();
  for (const suffix of Object.values(UNIT_SUFFIX)) {
    if (s.toLowerCase().endsWith(suffix.toLowerCase())) {
      return s.slice(0, -suffix.length).trim();
    }
  }
  return s;
}

export default function SellDetails() {
  const router = useRouter();
  const { draft, setDraft, showToast } = useApp();
  const [title, setTitle] = useState(draft.title);
  const [price, setPrice] = useState(draft.price);
  const [unit, setUnit] = useState(draft.areaUnit);
  const [area, setArea] = useState(draft.area);
  const [beds, setBeds] = useState(draft.beds === "-" ? "" : draft.beds);
  const [baths, setBaths] = useState(draft.baths === "-" ? "" : draft.baths);
  const [floor, setFloor] = useState(draft.floor ?? "");
  const [corner, setCorner] = useState(draft.corner ?? "");
  const [desc, setDesc] = useState(draft.desc);

  const onContinue = () => {
    if (!title.trim()) {
      showToast("Give your listing a title");
      return;
    }
    if (!price.trim()) {
      showToast("Enter a price");
      return;
    }
    if (!area.trim()) {
      showToast("Enter the area");
      return;
    }
    if (!desc.trim()) {
      showToast("Add a short description");
      return;
    }
    setDraft({
      title: title.trim(),
      price: price.trim(),
      areaUnit: unit,
      area: `${bareArea(area)} ${UNIT_SUFFIX[unit] ?? ""}`.trim(),
      beds: beds.trim() || "-",
      baths: baths.trim() || "-",
      floor: floor.trim(),
      corner,
      desc: desc.trim(),
    });
    router.push("/sell/photos");
  };

  return (
    <Screen keyboard header={<PageHead title="Property Details" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={title} onChangeText={setTitle} placeholder="Listing title" testID="details-title" />
        <Field value={price} onChangeText={setPrice} placeholder="Price" testID="details-price" />
        <View>
          <T weight={700} size={11} color={colors.faint} ls={0.6} style={{ marginBottom: 8, textTransform: "uppercase" }}>
            Area unit
          </T>
          <SelectChips items={UNITS} value={unit} onSelect={setUnit} testIDPrefix="details-unit" />
        </View>
        <Field value={area} onChangeText={setArea} placeholder="Area" testID="details-area" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field value={beds} onChangeText={setBeds} placeholder="Beds" keyboardType="number-pad" testID="details-beds" />
          </View>
          <View style={{ flex: 1 }}>
            <Field value={baths} onChangeText={setBaths} placeholder="Baths" keyboardType="number-pad" testID="details-baths" />
          </View>
        </View>
        {/* BOTH OPTIONAL, and both stay unanswered when skipped. The facts
            row shows "–" rather than inventing a ground floor or a No. */}
        <Field
          value={floor}
          onChangeText={setFloor}
          placeholder="Floor (optional, 0 for ground)"
          keyboardType="number-pad"
          testID="details-floor"
        />
        <View>
          <T weight={700} size={11} color={colors.faint} ls={0.6} style={{ marginBottom: 8, textTransform: "uppercase" }}>
            Corner plot
          </T>
          <SelectChips
            items={["Not stated", "Yes", "No"]}
            value={corner === "yes" ? "Yes" : corner === "no" ? "No" : "Not stated"}
            onSelect={(v) => setCorner(v === "Yes" ? "yes" : v === "No" ? "no" : "")}
            testIDPrefix="details-corner"
          />
        </View>
        <Textarea value={desc} onChangeText={setDesc} placeholder="Describe the property" testID="details-desc" />
        <Button label="Continue" onPress={onContinue} testID="details-continue" />
      </View>
    </Screen>
  );
}
