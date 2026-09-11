import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { colors, shadow } from "@/src/theme";

export function ChoiceCard({
  title,
  sub,
  selected,
  onPress,
  testID,
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <T weight={700} size={14.5} color={selected ? "#fff" : colors.ink}>
        {title}
      </T>
      {sub ? (
        <T weight={500} size={11.5} color={selected ? "#cfcfcf" : colors.muted} style={{ marginTop: 5, lineHeight: 16 }}>
          {sub}
        </T>
      ) : null}
    </Pressable>
  );
}

export function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function SelectChips({
  items,
  value,
  onSelect,
  testIDPrefix,
}: {
  items: string[];
  value: string;
  onSelect: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <Pressable
            key={it}
            onPress={() => onSelect(it)}
            testID={testIDPrefix ? `${testIDPrefix}-${it}` : undefined}
            style={[styles.chip, on && styles.chipOn]}
          >
            <T weight={700} size={12} color={on ? "#fff" : colors.ink}>
              {it}
            </T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    width: "47.8%",
    flexGrow: 1,
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    ...shadow.soft,
  },
  choiceOn: { backgroundColor: "#111", borderColor: "#111" },
  chip: {
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipOn: { backgroundColor: "#111", borderColor: "#111" },
});
