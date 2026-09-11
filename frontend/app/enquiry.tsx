import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Empty, PageHead, Screen, T } from "@/src/components/ui";
import { localityOf } from "@/src/lib/listing-facts";
import { checkForPhone } from "@/src/lib/phone-filter";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";
import { useApp } from "@/src/store/AppContext";

// A BOTTOM SHEET, not a page.
//
// This was a full screen carrying two text boxes and a button, about 60%
// empty, for what is one decision and one optional sentence. It is now a
// sheet the height of its own content over a dim that closes on tap.
//
// STILL A ROUTE. /enquiry?id= is a real URL and a deep link still lands here,
// still hits the ownership guard, and still writes exactly the lead it used
// to. Only the surface changed.
//
// NO NATIVE MODAL and no blur: a plain absolutely-positioned dim plus a sheet
// pinned to the bottom, so nothing new is linked into the binary.

const PRESETS = [
  "Is it still available?",
  "Can I visit this week?",
  "Is the price negotiable?",
];

export default function Enquiry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast, iOwn } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];

  // ENTRY GUARD. A deep link is a doorway like any other: /enquiry?id=<my own
  // listing> used to render the form and write a lead from me to me. Refused
  // here, and refused again in addLead, which throws on buyerUid === sellerUid.
  const mine = iOwn(listing);

  const [preset, setPreset] = useState(PRESETS[0]);
  const [extra, setExtra] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockSample, setBlockSample] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    if (sending || sent) return;

    // THE PHONE FILTER STILL RUNS, on the free-text box. Same rule as the
    // thread composer: the send is refused, the text stays where the buyer
    // typed it, and the fragment that tripped it is quoted back. Nothing is
    // silently stripped. The presets are fixed strings and cannot carry one.
    const body = extra.trim();
    if (body) {
      const check = checkForPhone(body);
      if (check.blocked) {
        setBlockReason(check.reason);
        setBlockSample(check.sample);
        return;
      }
    }

    // Null means this listing has no seller anything can reach: no sellerUid,
    // and its numeric seller matches nobody. Sending would write a lead into a
    // collection no account can read and then say "Inquiry sent".
    const seller = sellerOf(listing);
    if (!seller) {
      showToast("This listing has no seller on record. Nothing was sent.");
      return;
    }

    setSending(true);
    try {
      await addLead(listing.id, seller.id, "enquiry", body ? `${preset} ${body}` : preset);
      showToast("Inquiry sent");
      setSent(true);
      setTimeout(() => router.back(), 450);
    } catch (e: any) {
      showToast(
        e?.code === "own-listing"
          ? "This is your own listing."
          : "Could not send your inquiry. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  };

  if (mine) {
    return (
      <Screen header={<PageHead title="Inquiry" onBack={() => router.back()} />}>
        <Empty
          title="This is your listing"
          body="You cannot send an inquiry about a property you published. Open it from your store to edit it instead."
        />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      {/* The dim. Tapping it closes the sheet, which is the whole reason a
          sheet is the right shape here: the buyer can back out with a tap
          anywhere rather than hunting for a header arrow. */}
      <Pressable style={styles.dim} onPress={() => router.back()} testID="enquiry-dim" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grab} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Image source={{ uri: listing?.img }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T weight={w.title} size={13.5} numberOfLines={1}>
                  {listing?.title}
                </T>
                <T weight={w.body} size={12} color={colour.ink2} numberOfLines={1} style={{ marginTop: 2 }}>
                  {[listing?.price, localityOf(listing)].filter(Boolean).join(" · ")}
                </T>
              </View>
            </View>

            <T weight={w.body} size={12} color={colour.ink2} style={styles.label}>
              What do you want to ask?
            </T>

            <View style={{ gap: 8 }}>
              {PRESETS.map((p) => {
                const on = p === preset;
                return (
                  <Pressable
                    key={p}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setPreset(p)}
                    testID={`enquiry-preset-${p}`}
                  >
                    <T weight={w.label} size={12.5} color={on ? colour.paper : colour.ink}>
                      {p}
                    </T>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={extra}
              onChangeText={(v) => {
                setExtra(v);
                if (blockReason) {
                  setBlockReason("");
                  setBlockSample("");
                }
              }}
              placeholder="Add anything else (optional)"
              placeholderTextColor={colour.ink3}
              style={styles.box}
              multiline
              testID="enquiry-extra"
            />

            {blockReason ? (
              <View style={styles.blocked} testID="enquiry-blocked">
                <T weight={w.title} size={12.5} color={colour.accent}>
                  {blockReason}
                </T>
                {blockSample ? (
                  <T weight={w.body} size={12} color={colour.ink2} style={{ marginTop: 3 }}>
                    Remove “{blockSample}” to send this.
                  </T>
                ) : null}
              </View>
            ) : null}

            <Pressable
              style={[styles.send, (sending || sent) && { opacity: 0.6 }]}
              onPress={onSend}
              testID="enquiry-send"
            >
              <T weight={w.title} size={14.5} color={colour.paper}>
                {sent ? "Sent" : sending ? "Sending…" : "Send inquiry"}
              </T>
            </Pressable>

            <T weight={w.body} size={11.5} color={colour.ink3} style={styles.footer}>
              The seller&apos;s number appears here once they reply.
            </T>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(12,10,8,0.5)" },
  sheet: {
    backgroundColor: colour.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "88%",
  },
  grab: {
    width: 34,
    height: 4,
    borderRadius: r.pill,
    backgroundColor: "#DCD8D2",
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colour.line,
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colour.shell },
  label: { marginTop: 14, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colour.line,
    backgroundColor: "#FAF9F7",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  chipOn: { backgroundColor: colour.ink, borderColor: colour.ink },
  box: {
    marginTop: 12,
    height: 74,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: colour.line,
    backgroundColor: "#FAF9F7",
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 13,
    color: colour.ink,
    textAlignVertical: "top",
  },
  blocked: {
    marginTop: 10,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: "rgba(180,71,42,0.3)",
    backgroundColor: "rgba(180,71,42,0.06)",
    padding: 11,
  },
  send: {
    marginTop: 14,
    backgroundColor: colour.ink,
    borderRadius: r.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  footer: { textAlign: "center", marginTop: 12 },
});
