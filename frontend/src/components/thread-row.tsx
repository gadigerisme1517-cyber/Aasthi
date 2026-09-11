import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { watchLastMessage } from "@/src/services/db";
import { colors } from "@/src/theme";

// ONE conversation row. Used by /my-enquiries AND by the inquiry strip on the
// storefront, so the two cannot drift into looking like different products.
//
// It reads like a messaging app because that is what it is now: who, what was
// last said, when. The type pill, the quoted message block and the card
// border are all gone — they made a conversation look like a filed document.
//
// THE PROPERTY LINE STAYS. It is not decoration: the same two people can hold
// several threads at once, one per property, and an inquiry and a visit
// request on the SAME listing are two threads with the same name and often a
// similar preview. Without the title the rows are not distinguishable. That
// is the whole argument for the third line.
//
// EACH ROW SUBSCRIBES TO ITS OWN LAST MESSAGE — one document, ordered
// descending, limit 1. Not the whole thread. That is one listener per visible
// row, which is right for a list of this size and would need a per-thread
// summary document if inquiries ever ran to hundreds.

const AVATAR = 46;

function whenText(ts: any): string {
  const seconds = ts?.seconds;
  if (!seconds) return "";
  const then = seconds * 1000;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(then).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const ASK: Record<string, string> = {
  enquiry: "sent an inquiry",
  visit: "asked to visit",
  contact: "asked for your number",
};

// A letter, not a stock photograph. The old default avatar was a photo of a
// specific real person, which every account without a picture wore — so two
// different people appeared as the same face.
function Avatar({ uri, name }: { uri?: string; name: string }) {
  if (uri) return <Image source={{ uri }} style={styles.avatar} contentFit="cover" />;
  const letter = (name.trim()[0] || "A").toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarLetter]}>
      <T weight={700} size={17} color={colors.muted}>
        {letter}
      </T>
    </View>
  );
}

export function ThreadRow({
  lead,
  meUid,
  unread,
  name,
  avatar,
  onPress,
  testID,
}: {
  lead: any;
  // Which uid is "me" on THIS lead. The caller knows which side it is
  // rendering, so the row does not have to guess.
  meUid?: string;
  unread: boolean;
  name: string;
  avatar?: string;
  onPress: () => void;
  testID?: string;
}) {
  const [last, setLast] = useState<any | null>(null);

  useEffect(() => {
    if (!lead?.id) return;
    return watchLastMessage(lead.id, setLast);
  }, [lead?.id]);

  // No reply yet: the original inquiry IS the conversation so far.
  const fallback =
    lead.message?.trim() || `${name} ${ASK[lead.type] ?? "got in touch"}`;
  const body = last?.text?.trim() || fallback;
  const mine = last ? last.senderUid === meUid : false;
  const preview = mine ? `You: ${body}` : body;
  const when = whenText(last?.sentAt ?? lead.ts);
  const title = lead.listingTitle?.trim();

  return (
    <Pressable style={styles.row} onPress={onPress} testID={testID}>
      <Avatar uri={avatar} name={name} />
      <View style={styles.middle}>
        <T weight={700} size={15.5} numberOfLines={1}>
          {name}
        </T>
        <T weight={400} size={13.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {preview}
        </T>
        {title ? (
          <T weight={500} size={12} color={colors.faint} numberOfLines={1} style={{ marginTop: 3 }}>
            {title}
          </T>
        ) : null}
      </View>
      <View style={styles.right}>
        <T weight={500} size={11.5} color={colors.muted}>
          {when}
        </T>
        {unread ? <View style={styles.dot} testID={`${testID}-unread`} /> : null}
      </View>
    </Pressable>
  );
}

export const threadRowStyles = StyleSheet.create({
  // Full-bleed hairline between rows, no gaps and no card edges. Exported so
  // both screens draw the same separator rather than inventing one each.
  divider: { height: 1, backgroundColor: colors.line },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: colors.soft },
  avatarLetter: { alignItems: "center", justifyContent: "center" },
  middle: { flex: 1, minWidth: 0 },
  right: { alignItems: "flex-end", gap: 7, paddingLeft: 6 },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.red },
});
