import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { localityOf, photosOf, trustFact } from "@/src/lib/listing-facts";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";

// THE THIRD BROWSE VIEW. Two columns, photo-led, for scanning a lot of
// property quickly.
//
// NO FACTS ROW. Four ruled columns do not fit in half a phone width, and a
// squeezed one would ellipsise every label into nothing. Trust survives as a
// single glyph, which is the one thing that cannot be inferred from the
// photograph.
//
// Same photosOf, same locality helper, same trust helper and the same
// ownership guard as the card and the compact row. This file only lays out.

const PHOTO = 140;

export function GridTile({
  listing,
  saved,
  onPress,
  onToggleSave,
}: {
  listing: Listing;
  saved?: boolean;
  onPress?: () => void;
  // Absent means no heart: the screen withholds it for a listing you own.
  onToggleSave?: () => void;
}) {
  const photos = photosOf(listing);
  const trust = trustFact(listing);

  return (
    <Pressable style={styles.tile} onPress={onPress} testID={`grid-tile-${listing.id}`}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
        <LinearGradient
          colors={["transparent", "rgba(12,10,8,0.7)"]}
          style={styles.scrim}
          pointerEvents="none"
        />

        {photos.length > 1 ? (
          <View style={styles.count} testID={`grid-count-${listing.id}`}>
            <T weight={w.title} size={9.5} color={colour.paper}>
              {photos.length}
            </T>
          </View>
        ) : null}

        {onToggleSave ? (
          <Pressable
            style={[styles.heart, saved && styles.heartOn]}
            onPress={onToggleSave}
            hitSlop={10}
            testID={`grid-save-${listing.id}`}
          >
            <Icon name="heart" size={13} color={saved ? colour.accent : colour.paper} filled={saved} />
          </Pressable>
        ) : null}

        <T weight={w.title} size={14.5} color={colour.paper} numberOfLines={1} style={styles.price}>
          {listing.price}
        </T>
      </View>

      <View style={styles.body}>
        <T weight={w.label} size={11.5} numberOfLines={1}>
          {listing.title}
        </T>
        <View style={styles.meta}>
          <T weight={w.body} size={10.5} color={colour.ink3} numberOfLines={1} style={{ flex: 1 }}>
            {localityOf(listing)}
          </T>
          {/* The glyph alone. "Verified" does not fit beside a locality at
              this width, and a truncated word is worse than the mark. */}
          <T weight={w.title} size={10.5} color={trust.verified ? colour.green : colour.ink3}>
            {trust.value}
          </T>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    backgroundColor: colour.paper,
    borderWidth: 1,
    borderColor: colour.line,
    borderRadius: 12,
    overflow: "hidden",
  },
  // 140, not 128: a phone photograph of a Kurnool house is mostly sky and
  // compound wall, and 12 more points is the difference between seeing the
  // building and seeing the gate.
  photoWrap: { height: PHOTO, backgroundColor: colour.shell },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60 },
  count: {
    position: "absolute",
    top: 7,
    left: 7,
    borderRadius: 4,
    backgroundColor: colour.scrim,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  heart: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: r.pill,
    backgroundColor: colour.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  heartOn: { backgroundColor: colour.paper },
  price: { position: "absolute", left: 9, bottom: 8 },
  body: { paddingTop: 8, paddingHorizontal: 10, paddingBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
});
