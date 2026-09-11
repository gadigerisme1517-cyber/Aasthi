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

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Same reason as enquiry.tsx: confirm only after the write lands.
  const onRequest = async () => {
    if (sending || sent) return;
    // Same guard as enquiry.tsx: no resolvable seller, no request.
    const seller = sellerOf(listing);
    if (!seller) {
      showToast("This listing has no seller on record. Nothing was sent.");
      return;
    }
    setSending(true);
    const chosen = SLOTS[slot];
    try {
      await addLead(listing.id, seller.id, "visit", `${chosen.title}, ${chosen.sub}`);
      showToast("Visit request sent");
      // Confirms in place. This used to replace the screen with
      // /request-sent, a page whose only content was the sentence the toast
      // now carries — and which threw away the slot the buyer had picked.
      setSent(true);
    } catch {
      showToast("Could not send your visit request. Check your connection and try again.");
      setSending(false);
    }
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
      <Button
        label={sent ? "Visit requested" : sending ? "Sending…" : "Request Visit"}
        variant={sent ? "light" : undefined}
        onPress={onRequest}
        style={{ marginTop: 14 }}
        testID="visit-request"
      />
      {sent ? (
        <T weight={500} size={12.5} color={colors.muted} style={{ marginTop: 10, lineHeight: 18 }}>
          The seller has been notified and will confirm the slot with you.
        </T>
      ) : null}
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
