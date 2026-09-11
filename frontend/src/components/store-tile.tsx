import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { colors } from "@/src/theme";

// The HALF-WIDTH tile used only inside a storefront catalogue.
//
// FeatureCard is untouched and still owns Home and Search. A store is a shop
// and a shop shows a grid; one full-width card per row reads as a timeline of
// things posted, which is what a profile does.
//
// OWNER CONTROLS ARE AN OVERFLOW BUTTON, NOT A BAR. Edit / Hide / Mark sold
// as three text buttons need about 150pt of panel; this panel is ~150pt wide
// in total, so the row would wrap or truncate on the first narrow phone. The
// button opens /edit-listing, which now carries all four controls including
// the visibility toggle that used to live only on the bar — so nothing was
// lost, it moved somewhere it fits.

const PHOTO = 128;
const VERIFIED_GREEN = "#12a05e";

function photosOf(listing: Listing): string[] {
  const rest = (listing.g ?? []).filter((u) => u && u !== listing.img);
  return [listing.img, ...rest].filter(Boolean) as string[];
}

// "2 BHK · 1,740" — numbers in ink, words muted, one line, no boxes.
function Spec({ listing }: { listing: Listing }) {
  const bits: { n?: string; w: string }[] = [];
  if (listing.beds && listing.beds !== "-") bits.push({ n: listing.beds, w: "BHK" });
  if (listing.area) {
    const [n, ...unit] = String(listing.area).trim().split(" ");
    bits.push({ n, w: unit.join(" ") });
  }
  if (!bits.length && listing.facing) bits.push({ w: listing.facing });
  if (!bits.length) return null;
  return (
    <T weight={500} size={11} color={colors.muted} numberOfLines={1} style={{ marginTop: 4 }}>
      {bits.map((b, i) => (
        <T key={i} weight={500} size={11} color={colors.muted}>
          {i > 0 ? " · " : ""}
          {b.n ? (
            <T weight={700} size={11} color={colors.ink}>
              {b.n}
            </T>
          ) : null}
          {b.n ? " " : ""}
          {b.w}
        </T>
      ))}
    </T>
  );
}

function Marker({ status }: { status?: string }) {
  if (status === "verified") {
    return (
      <View style={styles.marker}>
        <Icon name="check" size={11} color={VERIFIED_GREEN} />
        <T weight={700} size={10.5} color={VERIFIED_GREEN}>
          Verified
        </T>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={styles.marker}>
        <View style={styles.hollow} />
        <T weight={700} size={10.5} color={colors.muted}>
          Pending
        </T>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={styles.marker}>
        <View style={[styles.hollow, { borderColor: colors.red }]} />
        <T weight={700} size={10.5} color={colors.red}>
          Rejected
        </T>
      </View>
    );
  }
  return null;
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
  // Buyer only. The heart that used to sit on the full-width card here —
  // shortlisting from a store must not disappear because the card got
  // smaller. Owner and buyer never both occupy this corner.
  saved?: boolean;
  onToggleSave?: () => void;
  hidden?: boolean;
  sold?: boolean;
}) {
  const photos = photosOf(listing);
  const isRent = listing.type === "Rent";
  const isTokenPaid = (listing as any).saleStatus === "token";

  return (
    <Pressable style={styles.tile} onPress={onPress} testID={`store-tile-${listing.id}`}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: listing.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />

        <View style={styles.typePill}>
          <T weight={700} size={9.5} ls={0.5} color={colors.ink} style={styles.upper}>
            {listing.type}
          </T>
        </View>

        {onManage ? (
          <Pressable style={styles.manage} onPress={onManage} hitSlop={8} testID={`store-tile-manage-${listing.id}`}>
            <Icon name="more" size={15} color={colors.ink} />
          </Pressable>
        ) : onToggleSave ? (
          <Pressable style={styles.manage} onPress={onToggleSave} hitSlop={8} testID={`store-tile-save-${listing.id}`}>
            <Icon name="heart" size={14} color={saved ? colors.red : colors.ink} filled={saved} />
          </Pressable>
        ) : null}

        <View style={styles.photoTags}>
          {photos.length > 1 ? (
            <View style={styles.darkPill}>
              <Icon name="camera" size={10} color="#fff" />
              <T weight={600} size={10} color="#fff">
                {photos.length}
              </T>
            </View>
          ) : null}
          {isTokenPaid ? (
            <View style={styles.darkPill}>
              <T weight={600} size={10} color="#fff">
                Token paid
              </T>
            </View>
          ) : null}
          {/* Owner-only states, shown so the owner can see them without
              opening anything. A buyer never receives these listings. */}
          {hidden ? (
            <View style={styles.darkPill}>
              <T weight={600} size={10} color="#fff">
                Hidden
              </T>
            </View>
          ) : null}
          {sold ? (
            <View style={styles.darkPill}>
              <T weight={600} size={10} color="#fff">
                Sold
              </T>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.priceRow}>
          <T weight={700} size={16.5} ls={-0.4} numberOfLines={1}>
            {listing.price}
          </T>
          {isRent ? (
            <T weight={600} size={10.5} color={colors.muted} style={{ marginLeft: 3 }}>
              /mo
            </T>
          ) : null}
        </View>
        <T weight={700} size={12.5} numberOfLines={1} style={{ marginTop: 3 }}>
          {listing.title}
        </T>
        <T weight={500} size={11.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {listing.addr}
        </T>
        <Spec listing={listing} />
        <View style={{ marginTop: 6 }}>
          <Marker status={(listing as any).verificationStatus} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    borderRadius: 20,
    backgroundColor: colors.black,
    overflow: "hidden",
  },
  photoWrap: { height: PHOTO, backgroundColor: colors.soft2 },
  typePill: {
    position: "absolute",
    top: 8,
    left: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  upper: { textTransform: "uppercase" },
  manage: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTags: {
    position: "absolute",
    left: 8,
    bottom: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    maxWidth: "88%",
  },
  darkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(17,17,17,0.78)",
    paddingHorizontal: 7,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginTop: -14,
    marginHorizontal: 6,
    marginBottom: 6,
    padding: 11,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  marker: { flexDirection: "row", alignItems: "center", gap: 4 },
  hollow: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.4,
    borderColor: colors.muted,
  },
});
