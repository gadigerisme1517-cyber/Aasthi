import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { Listing, Seller } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { factsFor, plaqueLine, showsTypePill, trustFact } from "@/src/lib/listing-facts";
import { colors, radius, shadow } from "@/src/theme";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";
import { T } from "@/src/components/ui";

// ONE browse card, exported under both historical names.
//
// FeatureCard and ResultCard were two different shapes — a tall hero card and
// a small horizontal row — which meant a property looked like two different
// products depending on which list it appeared in. They are now the same
// card. The names are kept because call sites and their intent differ
// (FeatureCard can carry a heart and a preview mode; ResultCard is read-only).
//
// Deliberately NOT on this card any more: the boxed bed/bath/area/facing
// chips, the seller strip, and any second status row. Seller identity lives
// on /detail and the seller shop. Status is stated once, beside the price.

const VERIFIED_GREEN = "#12a05e";

function photosOf(listing: Listing): string[] {
  // Same convention as /detail and /gallery: `img` is the cover and `g` holds
  // the REST. If g still contains the cover (listings written before that was
  // fixed) the duplicate is dropped here too, so the count badge cannot lie.
  const rest = (listing.g ?? []).filter((u) => u && u !== listing.img);
  return [listing.img, ...rest].filter(Boolean) as string[];
}

// ONE browse card. Price and locality sit ON the photo in a plaque; the
// facts sit BELOW it in ruled columns. The old white panel that overlapped
// the photo by -36 is gone: it hid the bottom of every photograph and made
// the card taller than the information in it.
function FactCol({
  value,
  label,
  first,
  trust,
  green,
}: {
  value: string;
  label: string;
  first?: boolean;
  trust?: boolean;
  green?: boolean;
}) {
  return (
    <View style={[styles.col, trust && styles.colTrust, !first && styles.colRuled]}>
      <T
        weight={green ? w.title : trust ? w.label : w.title}
        size={13}
        ls={-0.1}
        color={green ? colour.green : trust ? colour.ink3 : colour.ink}
        numberOfLines={1}
      >
        {value}
      </T>
      <T weight={w.body} size={11} color={colour.ink3} numberOfLines={1} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

function BrowseCard({
  listing,
  saved,
  onPress,
  onToggleSave,
  preview,
  testIDPrefix,
}: {
  listing: Listing;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
  preview?: boolean;
  testIDPrefix: string;
}) {
  const photos = photosOf(listing);
  const facts = factsFor(listing);
  const trust = trustFact(listing);
  const isTokenPaid = (listing as any).saleStatus === "token";

  return (
    <Pressable style={styles.card} onPress={onPress} testID={`${testIDPrefix}-${listing.id}`}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />

        {/* TOP LEFT. The type pill only when the type is not already implied,
            and Token paid beside it — availability has to live somewhere and
            the bottom edge belongs to the plaque now. Verification is never
            here: that is column four. */}
        <View style={styles.topLeft}>
          {showsTypePill(listing) ? (
            <View style={styles.scrimPill}>
              <T weight={w.title} size={10.5} color={colour.paper}>
                {listing.type}
              </T>
            </View>
          ) : null}
          {isTokenPaid ? (
            <View style={styles.scrimPill} testID={`token-paid-${listing.id}`}>
              <T weight={w.title} size={10.5} color={colour.paper}>
                Token paid
              </T>
            </View>
          ) : null}
        </View>

        <View style={styles.topRight}>
          {photos.length > 1 ? (
            <View style={styles.photoCount} testID={`photo-count-${listing.id}`}>
              <T weight={w.title} size={10.5} color={colour.paper}>
                {photos.length}
              </T>
            </View>
          ) : null}
          {onToggleSave && !preview ? (
            <Pressable
              style={[styles.heart, saved && styles.heartOn]}
              onPress={onToggleSave}
              testID={`save-${listing.id}`}
              hitSlop={8}
            >
              <Icon name="heart" size={16} color={saved ? colour.accent : colour.paper} filled={saved} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.plaque}>
          <T weight={w.price} size={23} ls={-0.7} style={{ lineHeight: 23 }} numberOfLines={1}>
            {listing.price}
          </T>
          <T weight={w.label} size={12.5} color={colour.ink2} numberOfLines={1} style={{ marginTop: 4 }}>
            {plaqueLine(listing)}
          </T>
        </View>
      </View>

      <View style={styles.facts}>
        {facts.map((f, i) => (
          <FactCol key={`${f.label}-${i}`} value={f.value} label={f.label} first={i === 0} />
        ))}
        <FactCol value={trust.value} label={trust.label} trust={!trust.verified} green={trust.verified} />
      </View>
    </Pressable>
  );
}

export function FeatureCard({
  listing,
  saved,
  onPress,
  onToggleSave,
  preview,
}: {
  listing: Listing;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
  preview?: boolean;
}) {
  return (
    <BrowseCard
      listing={listing}
      saved={saved}
      onPress={onPress}
      onToggleSave={onToggleSave}
      preview={preview}
      testIDPrefix="feature-card"
    />
  );
}

export function ResultCard({
  listing,
  onPress,
  saved,
  onToggleSave,
}: {
  listing: Listing;
  onPress?: () => void;
  // Optional: most result lists are read-only and pass neither, in which case
  // no heart is rendered rather than a dead one.
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  return (
    <BrowseCard
      listing={listing}
      saved={saved}
      onPress={onPress}
      onToggleSave={onToggleSave}
      testIDPrefix="result-card"
    />
  );
}

// Both seller cards below show ONLY what the app can actually compute:
// the seller's own name and photos, the verified flag AASTHI itself sets, how
// many listings they have live right now, and where those listings are. The
// old "87 sold / 4.9 rating" pair was hardcoded in seed.ts with no reviews
// collection and no sale ledger behind either number, and a real agent got
// "0 sold / - rating" in the same slots. Both are gone.


// Where a seller actually works, read off their listings rather than claimed.
//
// `max` exists because the rail card is 168 wide and two localities truncated
// mid-word there on a real device ("Bellary Chowrasta · Panchalingala …"). The
// rail asks for one, the wide card on /sellers has the room for two.
export function localityLine(items: Listing[], max = 2): string {
  const parts: string[] = [];
  for (const l of items) {
    const first = (l.addr || "").split(",")[0].trim();
    if (first && !parts.includes(first)) parts.push(first);
    if (parts.length === max) break;
  }
  return parts.join(" · ");
}

function countLabel(n: number): string {
  if (!n) return "No listings yet";
  return `${n} listing${n === 1 ? "" : "s"}`;
}

// The one figure a seller card can honestly show, in one pill, on one line.
// Exported so the Saved > Stores rows use the identical component rather than
// a lookalike that can drift away from it.
export function CountPill({ n, style }: { n: number; style?: ViewStyle }) {
  return (
    <View style={[styles.countPill, style]}>
      <T weight={700} size={11}>
        {countLabel(n)}
      </T>
    </View>
  );
}

export function SellerRailCard({
  seller,
  listings,
  onPress,
}: {
  seller: Seller;
  // This seller's listings. The card derives the count and the locality line
  // from them, so there is no way to pass it a number that is not real.
  listings: Listing[];
  onPress?: () => void;
}) {
  const where = localityLine(listings, 1); // 168 wide: one locality only
  return (
    <Pressable style={styles.sellerMini} onPress={onPress} testID={`seller-mini-${seller.id}`}>
      <View style={styles.cover}>
        <Image source={{ uri: seller.cover }} style={{ flex: 1 }} contentFit="cover" />
      </View>
      <Image source={{ uri: seller.img }} style={styles.avatar} />
      <View style={styles.nameRow}>
        <T weight={700} size={12.5} ls={-0.2} numberOfLines={1} style={{ flexShrink: 1 }}>
          {seller.name}
        </T>
        {seller.verified ? <Icon name="check" size={13} color={VERIFIED_GREEN} /> : null}
      </View>
      {where ? (
        <T weight={500} size={10.5} color={colors.muted} numberOfLines={1} style={{ marginHorizontal: 3, marginBottom: 6 }}>
          {where}
        </T>
      ) : (
        <View style={{ marginBottom: 6 }} />
      )}
      {/* ONE figure, on one line. A lone stacked value-over-label box reads as
          half of a broken pair, which is exactly what it would have been. */}
      <CountPill n={listings.length} />
    </Pressable>
  );
}

export function SellerWideCard({
  seller,
  listings,
  onPress,
}: {
  seller: Seller;
  listings: Listing[];
  onPress?: () => void;
}) {
  const where = localityLine(listings);
  return (
    <Pressable style={styles.sellerWide} onPress={onPress} testID={`seller-wide-${seller.id}`}>
      <Image source={{ uri: seller.cover }} style={styles.wideCover} contentFit="cover" />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={[styles.nameRow, { marginTop: 0 }]}>
          <T weight={700} size={13.5} ls={-0.2} numberOfLines={1} style={{ flexShrink: 1 }}>
            {seller.name}
          </T>
          {seller.verified ? <Icon name="check" size={14} color={VERIFIED_GREEN} /> : null}
        </View>
        {where ? (
          <T weight={500} size={11} color={colors.muted} numberOfLines={1} style={{ marginVertical: 4, marginHorizontal: 3 }}>
            {where}
          </T>
        ) : null}
        <CountPill n={listings.length} style={{ alignSelf: "flex-start", paddingHorizontal: 12 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // No shadow. A hairline and a corner are enough to separate a card from
  // paper, and a stack of shadows on a scrolling list reads as fog.
  card: {
    marginBottom: 16,
    borderRadius: r.lg,
    overflow: "hidden",
    backgroundColor: colour.paper,
    borderWidth: 1,
    borderColor: colour.line,
  },
  photoWrap: { height: 198, backgroundColor: colour.shell },
  topLeft: {
    position: "absolute",
    top: 9,
    left: 9,
    flexDirection: "row",
    gap: 6,
    maxWidth: "70%",
    flexWrap: "wrap",
  },
  topRight: {
    position: "absolute",
    top: 9,
    right: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scrimPill: {
    borderRadius: r.sm,
    backgroundColor: colour.scrim,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  photoCount: {
    borderRadius: r.sm,
    backgroundColor: colour.scrim,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  heart: {
    width: 30,
    height: 30,
    borderRadius: r.pill,
    backgroundColor: colour.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  heartOn: { backgroundColor: colour.paper },
  // Flush into the bottom-left corner: the only rounded corner is the one
  // facing into the photo.
  plaque: {
    position: "absolute",
    left: 0,
    bottom: 0,
    maxWidth: "86%",
    backgroundColor: colour.paper,
    paddingTop: 11,
    paddingRight: 16,
    paddingBottom: 11,
    paddingLeft: 14,
    borderTopRightRadius: r.lg,
  },
  facts: {
    flexDirection: "row",
    paddingTop: 11,
    paddingRight: 14,
    paddingBottom: 12,
    paddingLeft: 14,
  },
  col: { flex: 1, minWidth: 0 },
  // Fixed so the three data columns never steal from trust, and trust never
  // steals from them.
  colTrust: { flex: 0, flexBasis: 58, flexGrow: 0, flexShrink: 0 },
  colRuled: { borderLeftWidth: 1, borderLeftColor: colour.line, paddingLeft: 10 },
  sellerMini: {
    width: 168,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    ...shadow.soft,
  },
  cover: { height: 64, borderRadius: 14, overflow: "hidden", backgroundColor: colors.soft },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: -20,
    marginLeft: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginBottom: 2,
    marginHorizontal: 3,
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  sellerWide: {
    flexDirection: "row",
    gap: 12,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    ...shadow.soft,
  },
  wideCover: { width: 96, height: 96, borderRadius: 16, backgroundColor: colors.soft },
});
