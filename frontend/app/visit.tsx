import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button, PageHead, Screen, T } from "@/src/components/ui";
import { colors, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

function dayLabel(date: Date, now: Date) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
  const dateText = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (diffDays === 0) return `Today, ${dateText}`;
  if (diffDays === 1) return `Tomorrow, ${dateText}`;
  return dateText;
}

function buildSlots(now: Date) {
  const eveningCutoff = new Date(now);
  eveningCutoff.setHours(17, 0, 0, 0);
  const firstDay = new Date(now);
  if (now >= eveningCutoff) firstDay.setDate(firstDay.getDate() + 1);
  const secondDay = new Date(firstDay);
  secondDay.setDate(firstDay.getDate() + 1);
  return [
    { title: `${dayLabel(firstDay, now)} evening`, sub: "5:00 PM – 7:00 PM" },
    { title: dayLabel(secondDay, now), sub: "10:00 AM – 12:00 PM" },
  ];
}

export default function Visit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const [slot, setSlot] = useState(0);
  const [SLOTS] = useState(() => buildSlots(new Date()));

  const onRequest = () => {
    const chosen = SLOTS[slot];
    addLead(listing.id, sellerOf(listing).id, "visit", `${chosen.title}, ${chosen.sub}`);
    showToast("Visit request sent");
    router.replace(`/request-sent?type=visit&id=${listing.id}`);
  };

  return (
    <Screen header={<PageHead title="Schedule Visit" onBack={() => router.back()} />}>
      <View style={styles.grid}>
        {SLOTS.map((s, i) => {
          const on = i === slot;
          return (
            <Pressable key={s.title} onPress={() => setSlot(i)} style={[styles.choice, on && styles.choiceOn]} testID={`visit-slot-${i}`}>
              <T weight={700} size={16} color={on ? "#fff" : colors.ink}>
                {s.title}
              </T>
              <T weight={500} size={12} color={on ? "#cfcfcf" : colors.muted} style={{ marginTop: 6 }}>
                {s.sub}
              </T>
            </Pressable>
          );
        })}
      </View>
      <Button label="Request Visit" onPress={onRequest} style={{ marginTop: 14 }} testID="visit-request" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10, marginTop: 20 },
  choice: {
    flex: 1,
    minHeight: 112,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    ...shadow.soft,
  },
  choiceOn: { backgroundColor: "#111", borderColor: "#111" },
});
