import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { STATE_LABEL, type ListingState } from "@/src/lib/listing-facts";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";

// The tile in a storefront catalogue. Two columns, and deliberately quieter
// than the browse card: someone already inside a shop is comparing that
// shop's stock, not deciding whether to walk in.
//
// THE TOP-RIGHT CONTROL BRANCHES ON OWNERSHIP, NEVER ON VIEW MODE. The heart
// and the overflow are mutually exclusive because the two audiences are, and
// the caller decides which by asking iOwn — not by asking which mode it is
// rendering.

const PHOTO = 112;

function shortDate(ts: any): string | null {
  const seconds = ts?.seconds;
  if (!seconds) return null;
  return new Date(seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// The date line, which changes with the state.
//
// Hidden and Sold read their own timestamp — written at the moment the owner
// flipped that switch. A listing hidden or sold BEFORE those fields existed
// has none, and gets no line at all rather than a date inferred from when it
// was posted, which would be a different fact wearing the right shape.
function dateLine(listing: Listing, state?: ListingState): string | null {
  if (state === "hidden") {
    const d = shortDate((listing as any).hiddenAt);
    return d ? `Hidden since ${d}` : null;
  }
  if (state === "sold") {
    const d = shortDate((listing as any).soldAt);
    return d ? `Sold ${d}` : null;
  }
  return postedText(listing);
}

function postedText(listing: Listing): string | null {
  const seconds = (listing as any).createdAt?.seconds;
  if (!seconds) return null;
  const days = Math.floor((Date.now() - seconds * 1000) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 14) return "Posted last week";
  if (days < 60) return `Posted ${Math.floor(days / 7)} weeks ago`;
  return `Posted ${Math.floor(days / 30)} months ago`;
}

// Four states, four colours, and only two of them are ever drawn as a badge.
const STATE_COLOUR: Record<ListingState, string> = {
  active: colour.green,
  pending: "#9A6B12",
  hidden: colour.ink3,
  sold: colour.accent,
};

export function StoreTile({
  listing,
  onPress,
  onManage,
  saved,
  onToggleSave,
  // Owner view only. A buyer never receives a state: hidden listings do not
  // reach them at all, sold ones only under the Sold tab, and "Pending" reads
  // as a fault in the property rather than in the paperwork.
  state,
}: {
  listing: Listing;
  onPress: () => void;
  // Owner only. Opens /edit-listing, which holds edit, visibility, sale
  // status and delete.
  onManage?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  state?: ListingState;
}) {
  const dimmed = state === "hidden" || state === "sold";
  const posted = dateLine(listing, state);

  return (
    <Pressable
      style={[styles.tile, dimmed && styles.tileDim]}
      onPress={onPress}
      testID={`store-tile-${listing.id}`}
    >
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: listing.img }}
          style={[StyleSheet.absoluteFill, dimmed && { opacity: 0.42 }]}
          contentFit="cover"
          transition={160}
        />
        <LinearGradient
          colors={["transparent", "rgba(12,10,8,0.72)"]}
          style={styles.scrim}
          pointerEvents="none"
        />

        {onManage ? (
          <Pressable style={styles.corner} onPress={onManage} hitSlop={8} testID={`store-tile-manage-${listing.id}`}>
            <Icon name="more" size={15} color={colour.paper} />
          </Pressable>
        ) : onToggleSave ? (
          <Pressable style={styles.corner} onPress={onToggleSave} hitSlop={8} testID={`store-tile-save-${listing.id}`}>
            <Icon name="heart" size={14} color={saved ? colour.accent : colour.paper} filled={saved} />
          </Pressable>
        ) : null}

        {/* THE DIM IS THE SIGNAL. Only the two states that take a listing out
            of circulation get a stamp; marking every tile would mean marking
            none of them. */}
        {dimmed ? (
          <View style={[styles.stamp, state === "sold" && styles.stampSold]}>
            <T weight={w.title} size={10.5} color={state === "sold" ? colour.paper : colour.ink}>
              {state === "sold" ? "Sold" : "Hidden"}
            </T>
          </View>
        ) : null}

        <T weight={w.title} size={14} color={colour.paper} numberOfLines={1} style={styles.price}>
          {listing.price}
        </T>
      </View>

      <View style={styles.body}>
        <T weight={w.label} size={12} numberOfLines={1}>
          {listing.title}
        </T>
        {/* "Posted 3 days ago", or "Hidden since 12 Sep" / "Sold 12 Sep" once
            the listing carries the stamp. Nothing at all when the date is not
            recorded — no line beats a wrong one. */}
        {posted ? (
          <T weight={w.body} size={11} color={colour.ink3} numberOfLines={1} style={{ marginTop: 3 }}>
            {posted}
          </T>
        ) : null}

        {state ? (
          <View style={styles.stateRow}>
            <View style={[styles.stateDot, { backgroundColor: STATE_COLOUR[state] }]} />
            <T weight={w.title} size={11} color={STATE_COLOUR[state]} numberOfLines={1}>
              {STATE_LABEL[state]}
            </T>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: colour.paper,
    borderWidth: 1,
    borderColor: colour.line,
    overflow: "hidden",
  },
  photoWrap: { height: PHOTO, backgroundColor: colour.shell },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 56 },
  corner: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    borderRadius: r.pill,
    backgroundColor: colour.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  tileDim: { backgroundColor: "#FAF9F7" },
  stamp: {
    position: "absolute",
    top: 7,
    left: 7,
    borderRadius: 5,
    backgroundColor: colour.paper,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  stampSold: { backgroundColor: colour.accent },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  price: { position: "absolute", left: 9, bottom: 8 },
  body: { paddingVertical: 9, paddingHorizontal: 10 },
});
