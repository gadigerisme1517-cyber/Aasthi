import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { MenuRow, PageHead, Screen, SectionLabel, T, ToggleRow } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const LANGS = ["English", "తెలుగు (Telugu)", "हिन्दी (Hindi)"];
const CURR = ["₹ Indian Rupee", "$ US Dollar"];

function SelectRow({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable style={styles.row} onPress={onPress} testID={testID}>
      <T weight={700} size={14.5}>
        {label}
      </T>
      <View style={[styles.dot, on && styles.dotOn]}>
        {on ? <Icon name="check" size={13} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { settings, setSetting, showToast } = useApp();

  return (
    <Screen header={<PageHead title="Settings" onBack={() => router.back()} />}>
      <SectionLabel>Language</SectionLabel>
      <View style={styles.group}>
        {LANGS.map((l) => (
          <SelectRow key={l} label={l} on={settings.language === l || (l === "English" && settings.language === "English")} onPress={() => { setSetting("language", l); showToast(l + " selected"); }} testID={`lang-${l}`} />
        ))}
      </View>

      <SectionLabel>Currency</SectionLabel>
      <View style={styles.group}>
        {CURR.map((c) => {
          const val = c.startsWith("₹") ? "₹ INR" : "$ USD";
          return (
            <SelectRow key={c} label={c} on={settings.currency === val} onPress={() => { setSetting("currency", val); showToast(val + " selected"); }} testID={`curr-${val}`} />
          );
        })}
      </View>

      <SectionLabel>Appearance</SectionLabel>
      <ToggleRow title="Dark mode" sub="Reduce glare in low light" value={settings.darkMode} onChange={() => { setSetting("darkMode", !settings.darkMode); showToast(settings.darkMode ? "Dark mode disabled" : "Dark mode enabled"); }} testID="toggle-dark" />

      <SectionLabel>Storage</SectionLabel>
      <MenuRow icon="trash" title="Clear cache" sub="Free up space used by AASTHI" onPress={() => showToast("Cache cleared · 0 MB freed")} testID="clear-cache" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadow.soft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: colors.black, borderColor: colors.black },
});
