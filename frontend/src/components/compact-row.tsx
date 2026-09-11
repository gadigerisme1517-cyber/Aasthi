import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { FACT_MISSING, factsFor, localityOf, photosOf, trustFact } from "@/src/lib/listing-facts";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";

// THE COMPACT VIEW of a listing. Same data, less height.
//
// It shares everything that could drift with the card: photosOf, the
// type-switch in listing-facts, the save handler passed in by the screen, and
// the ownership guard that decides whether onToggleSave is passed at all.
// There is no second copy of any of it here — this file only lays out.
//
// The one deliberate difference: a missing fact shows ONE chip rather than a
// dash. A dash is honest in a ruled column where the label explains it; a
// floating "–" chip explains nothing.

const HEIGHT = 124;
const PHOTO_W = 112;

export function CompactRow({
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
  const chips = factsFor(listing)
    .filter((f) => f.value !== FACT_MISSING)
    .slice(0, 2);

  return (
    <Pressable style={styles.row} onPress={onPress} testID={`compact-row-${listing.id}`}>
      <View style={styles.photo}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
        {photos.length > 1 ? (
          <View style={styles.count} testID={`compact-count-${listing.id}`}>
            <T weight={w.title} size={10} color={colour.paper}>
              {photos.length}
            </T>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.line}>
          <T weight={w.price} size={19} ls={-0.6} numberOfLines={1} style={{ flex: 1 }}>
            {listing.price}
          </T>
          {onToggleSave ? (
            <Pressable onPress={onToggleSave} hitSlop={10} testID={`compact-save-${listing.id}`}>
              <Icon name="heart" size={17} color={saved ? colour.accent : colour.ink3} filled={saved} />
            </Pressable>
          ) : null}
        </View>

        <T weight={w.label} size={12.5} numberOfLines={1} style={{ marginTop: 3 }}>
          {listing.title}
        </T>
        <T weight={w.body} size={11.5} color={colour.ink3} numberOfLines={1} style={{ marginTop: 2 }}>
          {localityOf(listing)}
        </T>

        <View style={[styles.line, { marginTop: 7 }]}>
          <View style={styles.chips}>
            {chips.map((f, i) => (
              <View key={`${f.label}-${i}`} style={styles.chip}>
                <T weight={w.label} size={11} color={colour.ink2} numberOfLines={1}>
                  {f.value} {f.label}
                </T>
              </View>
            ))}
          </View>
          {trust.verified ? (
            <View style={styles.trust}>
              <Icon name="check" size={11} color={colour.green} />
              <T weight={w.label} size={11} color={colour.green}>
                Verified
              </T>
            </View>
          ) : (
            <T weight={w.label} size={11} color={colour.ink3}>
              Pending
            </T>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: HEIGHT,
    flexDirection: "row",
    backgroundColor: colour.paper,
    borderWidth: 1,
    borderColor: colour.line,
    borderRadius: 12,
    marginBottom: 9,
    overflow: "hidden",
  },
  photo: { width: PHOTO_W, height: "100%", backgroundColor: colour.shell },
  count: {
    position: "absolute",
    left: 8,
    bottom: 8,
    borderRadius: 4,
    backgroundColor: colour.scrim,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingTop: 11,
    paddingRight: 12,
    paddingBottom: 11,
    paddingLeft: 13,
  },
  line: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { flexDirection: "row", gap: 6, flex: 1, minWidth: 0 },
  chip: {
    backgroundColor: colour.shell,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  trust: { flexDirection: "row", alignItems: "center", gap: 3 },
});
