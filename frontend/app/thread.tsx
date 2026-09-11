import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Empty, PageHead, Screen, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { checkForPhone } from "@/src/lib/phone-filter";
import { watchThread } from "@/src/services/db";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// ONE inquiry, as a conversation.
//
// The lead itself is never written to — firestore.rules denies every update
// to a lead, deliberately, because it is the immutable record that contact
// happened. The conversation lives in messages/{leadId}/items and the lead
// supplies the FIRST message, synthesised at render time rather than copied
// into the collection. That is why no backfill was needed for the inquiries
// that already existed.
//
// A number typed into the composer is refused before it sends. Calling is
// still allowed: the agent's Call button on /my-enquiries and the number
// reveal on /detail are untouched. See src/lib/phone-filter.ts.

const ASK: Record<string, string> = {
  enquiry: "sent an inquiry",
  visit: "asked to visit",
  contact: "asked for your number",
};

function whenText(ts: any): string {
  const seconds = ts?.seconds;
  if (!seconds) return "Sending…";
  const then = seconds * 1000;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Thread() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leadById, myLeads, sendMessage, markThreadSeen, markReplied, listings, showToast } =
    useApp();

  const lead = id ? leadById(id) : null;
  const listing = useMemo(
    () => listings.find((l) => l.id === lead?.listingId) ?? null,
    [listings, lead?.listingId],
  );

  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockSample, setBlockSample] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = watchThread(id, setItems);
    return unsub;
  }, [id]);

  // Opening the thread is reading it. Per thread, not per list.
  useEffect(() => {
    if (id) markThreadSeen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, items.length]);

  if (!lead) {
    return (
      <Screen header={<PageHead title="Inquiry" onBack={() => router.back()} />}>
        <Empty
          title="Inquiry not found"
          body="This conversation is no longer available on your account."
        />
      </Screen>
    );
  }

  // Which side of this lead the signed-in user is on. myLeads is the
  // seller-side subscription (leads where sellerUid == me), so membership in
  // it IS the answer — no need to pass a uid around. Everything about who
  // said what hangs off this one line.
  const iAmSeller = (myLeads as any[]).some((l) => l.id === lead.id);
  const meUid = iAmSeller ? lead.sellerUid : lead.buyerUid;
  const otherName = iAmSeller
    ? lead.buyerName?.trim() || "AASTHI buyer"
    : lead.sellerName?.trim() || listing?.sellerName || "the seller";

  const title = lead.listingTitle || listing?.title || "A listing";
  const gone = !listing;

  const onSend = async () => {
    const body = text.trim();
    if (!body || sending) return;

    const check = checkForPhone(body);
    if (check.blocked) {
      // Refused, and SHOWN. Never silently stripped: the sender has to be
      // able to see which fragment tripped it or the app looks broken.
      setBlockReason(check.reason);
      setBlockSample(check.sample);
      return;
    }

    setSending(true);
    try {
      await sendMessage(lead.id, body);
      setText("");
      setBlockReason("");
      setBlockSample("");
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      showToast("Could not send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      keyboard
      scroll={false}
      header={<PageHead title={otherName} onBack={() => router.back()} />}
      footer={
        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 8 }]}>
          {blockReason ? (
            <View style={styles.blocked} testID="thread-blocked">
              <Icon name="shield" size={15} color={colors.red} />
              <View style={{ flex: 1 }}>
                <T weight={700} size={12.5} color={colors.red}>
                  {blockReason}
                </T>
                {blockSample ? (
                  <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }}>
                    Remove “{blockSample}” to send this message.
                  </T>
                ) : null}
              </View>
            </View>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={(v) => {
                setText(v);
                if (blockReason) {
                  setBlockReason("");
                  setBlockSample("");
                }
              }}
              placeholder="Write a message"
              placeholderTextColor={colors.faint}
              style={styles.input}
              multiline
              testID="thread-input"
            />
            <Pressable
              style={[styles.send, (!text.trim() || sending) && styles.sendOff]}
              onPress={onSend}
              testID="thread-send"
            >
              <T weight={900} size={12.5} color={colors.white}>
                {sending ? "…" : "Send"}
              </T>
            </Pressable>
          </View>
        </View>
      }
    >
      {/* ---------- PROPERTY STRIP ---------- */}
      <Pressable
        style={[styles.strip, gone && styles.stripGone]}
        disabled={gone}
        onPress={() => listing && router.push(`/detail?id=${listing.id}`)}
        testID="thread-property"
      >
        {listing?.img ? (
          <Image source={{ uri: listing.img }} style={styles.stripImg} contentFit="cover" />
        ) : (
          <View style={[styles.stripImg, { backgroundColor: colors.soft2 }]} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <T weight={700} size={14} numberOfLines={1}>
            {title}
          </T>
          {gone ? (
            <T weight={600} size={11.5} color={colors.faint} style={{ marginTop: 3 }}>
              This listing has been removed.
            </T>
          ) : (
            <T weight={500} size={12} color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
              {listing?.price} · {listing?.addr}
            </T>
          )}
        </View>
        {gone ? null : <Icon name="chev" size={16} color={colors.muted} />}
      </Pressable>

      {/* CALL. Moved here from the inquiry list when that list became a
          conversation list — a card affordance had no place on a chat row,
          but the capability had to keep a home. Seller side only, and only
          when the buyer's number actually rode in on the lead, which happens
          only when they left "Show contact to sellers" on. The reply stamp is
          written AFTER the dialer opens: leadReplies/{leadId}, because the
          lead itself is immutable by rule. */}
      {iAmSeller ? (
        lead.buyerPhone ? (
          <Pressable
            style={styles.call}
            testID="thread-call"
            onPress={() =>
              Linking.openURL(`tel:${String(lead.buyerPhone).replace(/[^+\d]/g, "")}`)
                .then(() => markReplied(lead.id))
                .catch(() => showToast("Could not open the dialer"))
            }
          >
            <Icon name="phone" size={15} color={colors.white} />
            <T weight={900} size={12.5} color={colors.white}>
              Call {lead.buyerPhone}
            </T>
          </Pressable>
        ) : (
          <T weight={600} size={11.5} color={colors.faint} style={{ marginTop: 10 }}>
            No number shared — this buyer keeps their contact details private.
          </T>
        )
      ) : null}

      {/* ---------- CONVERSATION ---------- */}
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 14, gap: 10 }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
      >
        {/* MESSAGE #1 IS THE LEAD ITSELF, synthesised. It is not a header and
            it is not stored in the messages collection — nothing was written
            for the inquiries that already existed. */}
        <View style={[styles.bubble, iAmSeller ? styles.theirs : styles.mine]}>
          <T weight={700} size={12} color={iAmSeller ? colors.muted : "rgba(255,255,255,0.75)"}>
            {iAmSeller ? lead.buyerName?.trim() || "AASTHI buyer" : "You"}{" "}
            {ASK[lead.type] ?? "sent an inquiry"}
          </T>
          <T
            weight={500}
            size={14.5}
            color={iAmSeller ? colors.ink : colors.white}
            style={{ marginTop: 6, lineHeight: 20 }}
          >
            {lead.message?.trim() ||
              (lead.type === "contact"
                ? "No message — asked for the contact details."
                : "No message.")}
          </T>
          <T
            weight={600}
            size={10.5}
            color={iAmSeller ? colors.faint : "rgba(255,255,255,0.6)"}
            style={{ marginTop: 6 }}
          >
            {whenText(lead.ts)}
          </T>
        </View>

        {items.map((m) => {
          const mine = m.senderUid === meUid;
          return (
            <View
              key={m.id}
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              testID={`thread-msg-${m.id}`}
            >
              <T
                weight={500}
                size={14.5}
                color={mine ? colors.white : colors.ink}
                style={{ lineHeight: 20 }}
              >
                {m.text}
              </T>
              <T
                weight={600}
                size={10.5}
                color={mine ? "rgba(255,255,255,0.6)" : colors.faint}
                style={{ marginTop: 6 }}
              >
                {whenText(m.sentAt)}
              </T>
            </View>
          );
        })}

        {/* Stated once, at the bottom, so it reads as the rule of the room
            rather than an error. */}
        <T weight={500} size={11.5} color={colors.faint} style={styles.footnote}>
          Phone numbers cannot be sent in chat. Use Contact on the listing.
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    padding: 10,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft,
  },
  stripGone: { backgroundColor: "#fbfbfa" },
  call: {
    marginTop: 12,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.black,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stripImg: { width: 52, height: 52, borderRadius: 14 },
  bubble: {
    maxWidth: "86%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  mine: { alignSelf: "flex-end", backgroundColor: colors.black, borderBottomRightRadius: 6 },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 6,
  },
  footnote: { textAlign: "center", marginTop: 8, marginBottom: 4 },
  composerWrap: {
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.screen,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  blocked: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.25)",
    backgroundColor: "rgba(180,18,24,0.05)",
    padding: 11,
  },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: colors.soft,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 14.5,
    color: colors.ink,
  },
  send: {
    height: 46,
    minWidth: 66,
    borderRadius: 999,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sendOff: { opacity: 0.45 },
});
