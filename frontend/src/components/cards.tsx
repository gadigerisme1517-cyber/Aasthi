import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Listing, Seller } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
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
const DOT = "rgba(115,115,115,0.55)"; // colors.muted at 55%

function photosOf(listing: Listing): string[] {
  // Same convention as /detail and /gallery: `img` is the cover and `g` holds
  // the REST. If g still contains the cover (listings written before that was
  // fixed) the duplicate is dropped here too, so the count badge cannot lie.
  const rest = (listing.g ?? []).filter((u) => u && u !== listing.img);
  return [listing.img, ...rest].filter(Boolean) as string[];
}

function TrustMarker({ status }: { status?: string }) {
  if (status === "verified") {
    return (
      <View style={styles.trust} testID="card-trust-verified">
        <Icon name="check" size={13} color={VERIFIED_GREEN} />
        <T weight={700} size={12} color={VERIFIED_GREEN}>
          Verified
        </T>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={styles.trust} testID="card-trust-pending">
        <View style={styles.hollow} />
        <T weight={700} size={12} color={colors.muted}>
          Pending
        </T>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={styles.trust} testID="card-trust-rejected">
        <View style={[styles.hollow, { borderColor: colors.red }]} />
        <T weight={700} size={12} color={colors.red}>
          Rejected
        </T>
      </View>
    );
  }
  return null;
}

// "2 BHK · 2 baths · 2,240 sq.ft · East" as ONE text line: numbers heavier
// than the words, separators dimmed. Nested Text rather than boxed chips.
function SpecLine({ listing }: { listing: Listing }) {
  const parts: React.ReactNode[] = [];
  const push = (num: string | null, word: string, key: string) => {
    parts.push(
      <T key={key} weight={550} size={13} color={colors.muted}>
        {num ? <T weight={700} size={13} color={colors.ink}>{num}</T> : null}
        {num ? " " : ""}
        {word}
      </T>,
    );
  };

  if (listing.beds && listing.beds !== "-") push(listing.beds, "BHK", "beds");
  if (listing.baths && listing.baths !== "-") {
    push(listing.baths, listing.baths === "1" ? "bath" : "baths", "baths");
  }
  if (listing.area) {
    // "2,240 sq.ft" -> number bold, unit lighter.
    const [n, ...unit] = String(listing.area).trim().split(" ");
    push(n, unit.join(" "), "area");
  }
  if (listing.facing) push(null, listing.facing, "facing");

  if (!parts.length) return null;

  return (
    <T weight={550} size={13} color={colors.muted} numberOfLines={1}>
      {parts.map((p, i) => (
        <T key={`w${i}`} weight={550} size={13} color={colors.muted}>
          {i > 0 ? <T weight={550} size={13} color={DOT}>{"  ·  "}</T> : null}
          {p}
        </T>
      ))}
    </T>
  );
}

export type OwnerBar = {
  onEdit: () => void;
  onToggleHide: () => void;
  hidden?: boolean;
  // Exactly one of these is supplied: Delete for rentals, Mark sold for sales.
  onMarkSold?: () => void;
  onDelete?: () => void;
};

function BrowseCard({
  listing,
  saved,
  onPress,
  onToggleSave,
  preview,
  ownerBar,
  testIDPrefix,
}: {
  listing: Listing;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
  preview?: boolean;
  ownerBar?: OwnerBar;
  testIDPrefix: string;
}) {
  const photos = photosOf(listing);
  const isRent = listing.type === "Rent";
  const status = (listing as any).verificationStatus as string | undefined;
  // "sold" never reaches browse — browseListings filters it out — so the only
  // sale state worth a pill here is token-paid.
  const isTokenPaid = (listing as any).saleStatus === "token";

  return (
    <Pressable style={styles.card} onPress={onPress} testID={`${testIDPrefix}-${listing.id}`}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />

        <View style={styles.topRow}>
          {/* TYPE ONLY. Verification is stated once, beside the price. */}
          <View style={styles.typePill}>
            <T weight={700} size={11.5} ls={0.63} color={colors.ink} style={styles.upper}>
              {listing.type}
            </T>
          </View>
          {onToggleSave && !preview ? (
            <Pressable style={styles.save} onPress={onToggleSave} testID={`save-${listing.id}`} hitSlop={8}>
              <Icon name="heart" size={17} color={saved ? colors.red : colors.ink} filled={saved} />
            </Pressable>
          ) : null}
        </View>

        {/* Bottom-left cluster on the photo. Availability lives HERE, not on
            the price row: how many photos there are and whether the property
            is still going are facts about the listing, whereas the
            Verified/Pending marker beside the price is a claim about whether
            AASTHI checked it. They must not share a slot.
            The row collapses cleanly — with one photo the count is hidden and
            the Token paid pill takes the bottom-left position on its own. */}
        {photos.length > 1 || isTokenPaid ? (
          <View style={styles.photoTags}>
            {photos.length > 1 ? (
              <View style={styles.darkPill} testID={`photo-count-${listing.id}`}>
                <Icon name="camera" size={12} color="#fff" />
                <T weight={650} size={11.5} color="#fff">
                  {photos.length}
                </T>
              </View>
            ) : null}
            {isTokenPaid ? (
              <View style={styles.darkPill} testID={`token-paid-${listing.id}`}>
                <T weight={650} size={11.5} color="#fff">
                  Token paid
                </T>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <View style={styles.priceRow}>
          <View style={styles.priceWrap}>
            <T weight={800} size={27} ls={-0.95} numberOfLines={1}>
              {listing.price}
            </T>
            {isRent ? (
              <T weight={600} size={13} color={colors.muted} style={{ marginLeft: 4 }}>
                /month
              </T>
            ) : null}
          </View>
          <TrustMarker status={status} />
        </View>

        <T weight={700} size={17} numberOfLines={1} style={{ marginTop: 6 }}>
          {listing.title}
        </T>

        <T weight={500} size={13.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
          {listing.addr}
        </T>

        <View style={styles.hairline} />
        <SpecLine listing={listing} />

        {/* OWNER BAR. Rendered only when the storefront passes it, which it
            does only on the agent's own store. A buyer never receives these
            handlers, so there is no branch here that could leak them. */}
        {ownerBar ? (
          <>
            <View style={styles.hairline} />
            <View style={styles.ownerBar}>
              <OwnerAction label="Edit" onPress={ownerBar.onEdit} testID={`own-edit-${listing.id}`} />
              <View style={styles.vDivider} />
              <OwnerAction
                label={ownerBar.hidden ? "Unhide" : "Hide"}
                onPress={ownerBar.onToggleHide}
                testID={`own-hide-${listing.id}`}
              />
              <View style={styles.vDivider} />
              {ownerBar.onDelete ? (
                <OwnerAction
                  label="Delete"
                  onPress={ownerBar.onDelete}
                  danger
                  testID={`own-delete-${listing.id}`}
                />
              ) : (
                <OwnerAction
                  label="Mark sold"
                  onPress={ownerBar.onMarkSold ?? (() => {})}
                  testID={`own-sold-${listing.id}`}
                />
              )}
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function OwnerAction({
  label,
  onPress,
  danger,
  testID,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  testID: string;
}) {
  return (
    <Pressable style={styles.ownerAction} onPress={onPress} testID={testID} hitSlop={6}>
      <T weight={600} size={13} color={danger ? colors.red : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export function FeatureCard({
  listing,
  saved,
  onPress,
  onToggleSave,
  preview,
  ownerBar,
}: {
  listing: Listing;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
  preview?: boolean;
  ownerBar?: OwnerBar;
}) {
  return (
    <BrowseCard
      listing={listing}
      saved={saved}
      onPress={onPress}
      onToggleSave={onToggleSave}
      preview={preview}
      ownerBar={ownerBar}
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

export function SellerRailCard({
  seller,
  onPress,
}: {
  seller: Seller;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.sellerMini} onPress={onPress} testID={`seller-mini-${seller.id}`}>
      <View style={styles.cover}>
        <Image source={{ uri: seller.cover }} style={{ flex: 1 }} contentFit="cover" />
      </View>
      <Image source={{ uri: seller.img }} style={styles.avatar} />
      <T weight={700} size={12.5} ls={-0.2} style={{ marginTop: 6, marginBottom: 2, marginHorizontal: 3 }}>
        {seller.name}
      </T>
      <T weight={500} size={10.5} color={colors.muted} numberOfLines={1} style={{ marginHorizontal: 3, marginBottom: 6 }}>
        {seller.meta}
      </T>
      <View style={styles.sellerNums}>
        <View style={styles.numBox}>
          <T weight={800} size={12}>
            {seller.sold}
          </T>
          <T weight={800} size={9} color={colors.muted}>
            sold
          </T>
        </View>
        <View style={styles.numBox}>
          <T weight={800} size={12}>
            {seller.rating}
          </T>
          <T weight={800} size={9} color={colors.muted}>
            rating
          </T>
        </View>
      </View>
    </Pressable>
  );
}

export function SellerWideCard({
  seller,
  count,
  onPress,
}: {
  seller: Seller;
  count: number;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.sellerWide} onPress={onPress} testID={`seller-wide-${seller.id}`}>
      <Image source={{ uri: seller.cover }} style={styles.wideCover} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <T weight={700} size={13.5} ls={-0.2}>
          {seller.name}
        </T>
        <T weight={500} size={11} color={colors.muted} numberOfLines={1} style={{ marginVertical: 4 }}>
          {seller.meta}
        </T>
        <View style={styles.sellerNums}>
          <View style={styles.numBox}>
            <T weight={800} size={12}>
              {seller.sold}
            </T>
            <T weight={800} size={9} color={colors.muted}>
              sold
            </T>
          </View>
          <View style={styles.numBox}>
            <T weight={800} size={12}>
              {count}
            </T>
            <T weight={800} size={9} color={colors.muted}>
              listings
            </T>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: colors.black,
    ...shadow.card,
  },
  // 210, not 246: at 246 a card ran ~1374px and two of them plus the section
  // header did not clear the floating nav island on a 3120px screen.
  photoWrap: { height: 210, backgroundColor: colors.black },
  topRow: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typePill: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upper: { textTransform: "uppercase" },
  save: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  // bottom 48 still clears the panel at the shorter photo: the panel's top
  // edge sits at 210-36 = 174, this row's bottom edge at 210-48 = 162, so
  // there is 12px of daylight. No nudge needed.
  photoTags: {
    position: "absolute",
    left: 14,
    bottom: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  darkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  panel: {
    marginTop: -36,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  priceWrap: { flexDirection: "row", alignItems: "baseline", flexShrink: 1 },
  trust: { flexDirection: "row", alignItems: "center", gap: 5 },
  hollow: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 12,
    marginBottom: 10,
  },
  ownerBar: { flexDirection: "row", alignItems: "center" },
  ownerAction: { flex: 1, alignItems: "center", paddingVertical: 4 },
  vDivider: { width: 1, height: 16, backgroundColor: colors.line },

  // ---- seller cards, unchanged ----
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
  sellerNums: { flexDirection: "row", gap: 6 },
  numBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: "center",
    paddingVertical: 6,
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
