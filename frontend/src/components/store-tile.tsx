import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
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

export function StoreTile({
  listing,
  onPress,
  onManage,
  saved,
  onToggleSave,
  hidden,
  sold,
}: {
  listing: Listing;
  onPress: () => void;
  // Owner only. Opens /edit-listing, which holds edit, visibility, sale
  // status and delete.
  onManage?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  hidden?: boolean;
  sold?: boolean;
}) {
  const posted = postedText(listing);

  return (
    <Pressable style={styles.tile} onPress={onPress} testID={`store-tile-${listing.id}`}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
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

        {/* Owner-only states. A buyer never receives these listings at all. */}
        {hidden || sold ? (
          <View style={styles.state}>
            <T weight={w.label} size={10} color={colour.paper}>
              {hidden ? "Hidden" : "Sold"}
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
        {/* Rendered only when the listing carries a createdAt. Listings
            published before that field existed show nothing rather than a
            date invented from nowhere. */}
        {posted ? (
          <T weight={w.body} size={11} color={colour.ink3} numberOfLines={1} style={{ marginTop: 3 }}>
            {posted}
          </T>
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
  state: {
    position: "absolute",
    top: 7,
    left: 7,
    borderRadius: 4,
    backgroundColor: colour.scrim,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  price: { position: "absolute", left: 9, bottom: 8 },
  body: { paddingVertical: 9, paddingHorizontal: 10 },
});
