import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const ROOMS = ["Main hall", "Kitchen", "Master bedroom", "Balcony", "Road view"];

export default function Tour() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast, iOwn } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const pano = listing.g[0];
  const q = `?id=${listing.id}`;

  const [room, setRoom] = useState(ROOMS[0]);
  // Same treatment as /detail: contacting the seller writes the lead here and
  // confirms in place. It used to push /contact, which existed only to write
  // that lead and then say so.
  // Keyed to the listing for the same reason as /detail: this screen is reused
  // when it is opened again with a different id, and a bare boolean would
  // claim a request that was never made.
  const [contacting, setContacting] = useState(false);
  const [contactedId, setContactedId] = useState<string | null>(null);
  const contacted = contactedId === listing.id;

  const contactSeller = async () => {
    if (contacting || contacted) return;
    const seller = sellerOf(listing);
    if (!seller) {
      showToast("This listing has no seller on record. Nothing was sent.");
      return;
    }
    setContacting(true);
    try {
      await addLead(listing.id, seller.id, "contact");
      setContactedId(listing.id);
      showToast("Request sent. The seller has been notified.");
    } catch {
      showToast("Could not send the request. Check your connection and try again.");
    } finally {
      setContacting(false);
    }
  };
  const [paused, setPaused] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (paused) {
      loopRef.current?.stop();
      return;
    }
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pan, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pan, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [paused, pan]);

  const translateX = pan.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.darkBg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 28 }}>
        <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backDark} onPress={() => router.back()} testID="tour-back">
            <Icon name="arrowLeft" size={20} color="#fff" />
          </Pressable>
          <View>
            <T weight={700} size={20} color="#fff">
              360° Tour
            </T>
            <T weight={700} size={11} color="#aaa" style={{ marginTop: 2 }}>
              {listing.title}
            </T>
          </View>
        </View>

        <View style={styles.stage}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { scale: 1.15 }] }]}>
            <Image source={{ uri: pano }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.4)"]} style={StyleSheet.absoluteFill} />
          </Animated.View>

          <Pressable style={[styles.hotspot, { left: "60%", top: "40%" }]} onPress={() => setRoom("Kitchen")}>
            <View style={styles.dot} />
            <T weight={700} size={11}>
              Kitchen
            </T>
          </Pressable>
          <Pressable style={[styles.hotspot, { left: "20%", top: "56%" }]} onPress={() => setRoom("Main hall")}>
            <View style={styles.dot} />
            <T weight={700} size={11}>
              Hall
            </T>
          </Pressable>
          <Pressable style={[styles.hotspot, { left: "46%", top: "70%" }]} onPress={() => setRoom("Balcony")}>
            <View style={styles.dot} />
            <T weight={700} size={11}>
              Balcony
            </T>
          </Pressable>

          <View style={styles.hint}>
            <View style={{ flex: 1 }}>
              <T weight={700} size={15}>
                {room}
              </T>
              <T weight={700} size={11.5} color="#686868" style={{ marginTop: 3 }}>
                {paused ? "Paused — tap play to resume." : "Auto-pan preview. Tap pause for still viewing."}
              </T>
            </View>
            <Pressable style={styles.hintBtn} onPress={() => setPaused((p) => !p)} testID="tour-pause">
              <T weight={700} size={12} color="#fff">
                {paused ? "Play" : "Pause"}
              </T>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingVertical: 16 }}>
          {ROOMS.map((r) => {
            const on = r === room;
            return (
              <Pressable key={r} onPress={() => setRoom(r)} style={[styles.roomChip, on && styles.roomChipOn]}>
                <T weight={700} size={12} color={on ? colors.ink : "#fff"}>
                  {r}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.panel}>
          <T weight={700} size={17} color="#fff" style={{ marginBottom: 8 }}>
            Tour intelligence
          </T>
          <T weight={500} size={13} color="#bfbfbf" style={{ lineHeight: 20 }}>
            A panning preview of this property's photo, with tappable room labels for reference. Contact the seller to arrange a full in-person or video walkthrough.
          </T>
        </View>

        {/* Both actions are buyer actions. On your own listing neither is
            offered: one would book you a viewing of your own property, the
            other would write you a lead from yourself. */}
        {iOwn(listing) ? null : (
        <View style={styles.actions}>
          <Pressable style={[styles.actBtn, { backgroundColor: "#fff" }]} onPress={() => router.push(`/visit${q}`)} testID="tour-visit">
            <T weight={700} size={14} color={colors.ink}>
              Schedule Visit
            </T>
          </Pressable>
          <Pressable
            style={[styles.actBtn, { backgroundColor: contacted ? "#12a05e" : colors.red }]}
            disabled={contacted}
            onPress={contactSeller}
            testID="tour-contact"
          >
            <T weight={700} size={14} color="#fff">
              {contacted ? "Requested" : contacting ? "Sending…" : "Contact Seller"}
            </T>
          </Pressable>
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 13, marginHorizontal: -18, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  backDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: { height: 520, marginHorizontal: -18, backgroundColor: "#111", overflow: "hidden", position: "relative" },
  hotspot: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red },
  hint: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    padding: 14,
  },
  hintBtn: { height: 40, borderRadius: 999, backgroundColor: "#111", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  roomChip: {
    height: 42,
    borderRadius: 999,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  roomChipOn: { backgroundColor: "#fff", borderColor: "#fff" },
  panel: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    padding: 16,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  actBtn: { flex: 1, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
