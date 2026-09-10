import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListingStatusTag, SaleStatusTag, T, TrustTag } from "@/src/components/ui";
import { countListingView } from "@/src/services/db";
import { auth } from "@/src/services/firebase";
import { Icon } from "@/src/icons";
import { colors, NAV_HEIGHT, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";
import { FEATURES } from "@/src/config";

const NEARBY = [
  { label: "School", dist: "0.8 km" },
  { label: "Hospital", dist: "1.2 km" },
  { label: "Main road", dist: "0.3 km" },
  { label: "Shops", dist: "0.5 km" },
];

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <T weight={900} size={13} numberOfLines={1}>
        {value}
      </T>
      <T weight={800} size={8.5} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
        {label}
      </T>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <T weight={900} size={10} color={colors.faint} ls={0.6} style={{ textTransform: "uppercase", marginBottom: 9 }}>
        {title}
      </T>
      {children}
    </View>
  );
}

function cleanDescription(listing: Record<string, any>) {
  const candidates = [
    listing.description,
    listing.propertyDescription,
    listing.details,
    listing.desc,
  ];
  const ids = [listing.id, listing.seedId].filter(Boolean);
  const text = candidates.find((value) => {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    return trimmed.length > 10 && !ids.includes(trimmed);
  });

  if (text) return text.trim();

  const facts = [
    listing.title,
    listing.area ? listing.area : null,
    listing.beds && listing.beds !== "-" ? `${listing.beds} bedrooms` : null,
    listing.baths && listing.baths !== "-" ? `${listing.baths} bathrooms` : null,
    listing.facing ? `${listing.facing}-facing` : null,
    listing.addr ? `located at ${listing.addr}` : null,
  ].filter(Boolean);

  return facts.length
    ? `${facts.join(", ")}. Confirm final measurements, documents and visit timing with the seller.`
    : "Property details are being updated. Message the seller to confirm full details before visiting.";
}

export default function Detail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { listings, sellerOf, isSaved, toggleSave, user, contactedListingIds } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const seller = sellerOf(listing ?? ({} as any));
  const saved = listing ? isSaved(listing.id) : false;
  const q = `?id=${listing?.id ?? ""}`;
  const heroImages = [listing?.img, ...(listing?.g ?? [])].filter(Boolean) as string[];
  const [heroIndex, setHeroIndex] = useState(0);
  const buyerIsPremium = !FEATURES.premium || Boolean((user as any)?.premium || (user as any)?.isPremium);
  // The number is earned, not given: it appears only once this buyer has
  // actually sent an enquiry / visit / contact request on THIS listing, and
  // only when the publisher supplied one. Seeded listings have no phone, so
  // they keep the old "Request number" state forever.
  const sellerPhone = (seller as any)?.phone?.trim?.() ?? "";
  const numberRevealed = Boolean(sellerPhone) && contactedListingIds.includes(listing?.id ?? "");
  const contactNumberLabel = buyerIsPremium ? "Request number" : "Get Premium";
  const contactNumberHint = buyerIsPremium ? "Seller approval needed" : "To view number";
  const descriptionText = cleanDescription(listing as any);

  // Count one view per opening of this screen, by anyone who is not the
  // owner. The ref stops React re-renders (hero paging, save toggles) from
  // counting again, and the uid check stops a seller inflating their own
  // number just by checking their listing.
  const counted = useRef<string | null>(null);
  const authUid = auth.currentUser?.uid ?? null;
  useEffect(() => {
    const id = listing?.id;
    if (!id || counted.current === id) return;
    const ownerUid = (listing as any)?.sellerUid;
    if (ownerUid && authUid && ownerUid === authUid) return; // owner: not a view
    counted.current = id;
    countListingView(id);
  }, [listing, authUid]);

  const onHeroScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setHeroIndex(Math.max(0, Math.min(next, heroImages.length - 1)));
  };

  if (!listing) {
    return <View style={{ flex: 1, backgroundColor: colors.screen }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: NAV_HEIGHT + insets.bottom + 82,
        }}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onHeroScrollEnd}
            style={StyleSheet.absoluteFill}
          >
            {heroImages.map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                onPress={() => router.push(`/gallery${q}&index=${index}`)}
                testID={index === 0 ? "detail-photo-gallery" : undefined}
              >
                <Image
                  source={{ uri }}
                  style={{ width, height: "100%" }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.62)"]}
            locations={[0, 0.42, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.controls, { top: insets.top + 8 }]}>
            <Pressable style={styles.circleDark} onPress={() => router.back()} testID="detail-back">
              <Icon name="arrowLeft" size={18} color="#fff" />
            </Pressable>
            <Pressable style={styles.circleDark} onPress={() => toggleSave(listing.id)} testID="detail-save">
              <Icon name="heart" size={18} color={saved ? colors.red : "#fff"} filled={saved} />
            </Pressable>
          </View>
          <View style={styles.photoCount}>
            <Icon name="camera" size={14} color="#fff" />
            <T weight={900} size={11} color="#fff">
              {heroIndex + 1} / {heroImages.length}
            </T>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.summary}>
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <T weight={900} size={25} ls={-1}>
                  {listing.price}
                </T>
                <T weight={800} size={17} ls={-0.4} style={{ marginTop: 4 }} numberOfLines={2}>
                  {listing.title}
                </T>
              </View>
              <View style={styles.vastuBadge}>
                <T weight={900} size={9} color={colors.green}>
                  Vastu
                </T>
                <T weight={800} size={11} color={colors.ink} style={{ marginTop: 2 }}>
                  {listing.facing}
                </T>
              </View>
            </View>

            <T weight={500} size={12} color="#5f5f62" style={{ marginTop: 8, lineHeight: 17 }}>
              {listing.addr}
            </T>

            {/* The PROPERTY's verification state. Distinct from the seller's
                TrustTag in the "Listed by" section below — one is about the
                listing, the other about the person. */}
            <View style={{ marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <ListingStatusTag status={(listing as any).verificationStatus} />
              <SaleStatusTag status={(listing as any).saleStatus} />
            </View>

            <View style={styles.factRow}>
              <Fact value={listing.beds} label="Beds" />
              <Fact value={listing.baths} label="Baths" />
              <Fact value={listing.area} label="Area" />
              <Fact value={listing.facing} label="Facing" />
            </View>
          </View>

          {FEATURES.tour360 ? (
            <Pressable style={styles.tourBar} onPress={() => router.push(`/tour${q}`)} testID="detail-tour">
              <View style={styles.tourIcon}>
                <Icon name="scan" size={19} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <T weight={900} size={14} color="#fff">
                  View 360-degree tour
                </T>
                <T weight={600} size={10.5} color="rgba(255,255,255,0.68)" style={{ marginTop: 2 }}>
                  Walk through rooms before visiting.
                </T>
              </View>
              <Icon name="chev" size={17} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : null}

          {/* Independent of the tour flag: a visit is always requestable, and
              when tour360 returns both bars should show, not one or the other. */}
          <Pressable style={styles.tourBar} onPress={() => router.push(`/visit${q}`)} testID="detail-visit">
            <View style={styles.tourIcon}>
              <Icon name="mapPin" size={19} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <T weight={900} size={14} color="#fff">
                Schedule a visit
              </T>
              <T weight={600} size={10.5} color="rgba(255,255,255,0.68)" style={{ marginTop: 2 }}>
                Pick a time that suits you.
              </T>
            </View>
            <Icon name="chev" size={17} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <Section title="Listed by">
            <Pressable
              style={styles.sellerRow}
              onPress={() =>
                router.push(
                  // A seller identity built from a user document has no
                  // numeric id, so route it by uid instead.
                  (seller as any).uid
                    ? `/seller?uid=${(seller as any).uid}`
                    : `/seller?id=${seller.id}`,
                )
              }
              testID="detail-seller"
            >
              <Image source={{ uri: seller.img }} style={styles.sellerImg} />
              <View style={{ flex: 1 }}>
                <T weight={800} size={14} numberOfLines={1}>
                  {seller.name}
                </T>
                <T weight={500} size={11} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                  {seller.meta}
                </T>
              </View>
              <TrustTag label={seller.trust} />
            </Pressable>
          </Section>

          <Section title="Location">
            <View style={styles.locationNote}>
              <Icon name="mapPin" size={17} color={colors.ink} />
              <T weight={600} size={12} color="#4f4f4f" style={{ flex: 1, lineHeight: 17 }}>
                Nearby location is approximate. Confirm exact location with the seller before visiting.
              </T>
            </View>
            <View style={styles.nearbyPills}>
              {NEARBY.map((item) => (
                <View key={item.label} style={styles.nearbyPill}>
                  <T weight={900} size={11}>
                    {item.label}
                  </T>
                  <T weight={800} size={10} color={colors.muted} style={{ marginLeft: 5 }}>
                    {item.dist}
                  </T>
                </View>
              ))}
            </View>
            <View style={styles.mapPreview}>
              <View style={styles.mapRoad} />
              <View style={[styles.mapRoad, styles.mapRoadAlt]} />
              <View style={styles.mapPin}>
                <T weight={900} size={10} color="#fff">
                  Approx. area
                </T>
              </View>
            </View>
          </Section>

          <Section title="Vastu">
            <Pressable style={styles.plainRow} onPress={() => router.push(`/vastu${q}`)} testID="detail-vastu">
              <View style={{ flex: 1 }}>
                <T weight={900} size={9.5} color={colors.faint} ls={0.5} style={{ textTransform: "uppercase" }}>
                  Vastu
                </T>
                <T weight={800} size={14} style={{ marginTop: 4 }}>
                  {listing.facing}-facing property
                </T>
                <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4, lineHeight: 17 }}>
                  Ask the seller to confirm entrance, kitchen, puja room and bedroom placement during visit.
                </T>
              </View>
              <Icon name="chev" size={16} color={colors.faint} />
            </Pressable>
          </Section>

          <Section title="Description">
            <View style={styles.descriptionBlock}>
              <T weight={500} size={14} color="#383838" style={{ lineHeight: 22 }}>
                {descriptionText}
              </T>
            </View>
          </Section>

          <Section title="Property ID">
            <View style={styles.propertyIdRow}>
              <T weight={800} size={12.5} color={colors.muted} numberOfLines={1}>
                {listing.id}
              </T>
            </View>
          </Section>
        </View>
      </ScrollView>

      <View style={[styles.stickyActions, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={[styles.stickyPill, styles.messagePill]} onPress={() => router.push(`/enquiry${q}`)} testID="detail-message">
          <Icon name="message" size={16} color="#fff" />
          <T weight={900} size={12.5} color="#fff">
            Message
          </T>
        </Pressable>
        <Pressable
          style={[styles.stickyPill, styles.numberPill]}
          onPress={() =>
            numberRevealed
              ? Linking.openURL(`tel:${sellerPhone.replace(/\s+/g, "")}`)
              : router.push(buyerIsPremium ? `/contact${q}` : `/premium${q}`)
          }
          testID={numberRevealed ? "detail-call-seller" : "detail-contact-number"}
        >
          <View style={styles.numberText}>
            <T weight={900} size={12.5} color={colors.ink} numberOfLines={1}>
              {numberRevealed ? sellerPhone : "Contact number"}
            </T>
            <T weight={700} size={9.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
              {numberRevealed ? `${seller.name}` : contactNumberHint}
            </T>
          </View>
          <View style={styles.numberAction}>
            <T weight={900} size={10.5} color="#fff" numberOfLines={1}>
              {numberRevealed ? "Call" : contactNumberLabel}
            </T>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 330, backgroundColor: "#111" },
  controls: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCount: {
    position: "absolute",
    right: 16,
    bottom: 34,
    height: 31,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sheet: {
    backgroundColor: "#fff",
    marginTop: -22,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  summary: {
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    ...shadow.soft,
  },
  priceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  vastuBadge: {
    minWidth: 64,
    borderRadius: 14,
    backgroundColor: "#eef8f2",
    paddingVertical: 8,
    paddingHorizontal: 9,
    alignItems: "center",
  },
  factRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  fact: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tourBar: {
    marginTop: 12,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    ...shadow.soft,
  },
  tourIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginTop: 18 },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sellerImg: { width: 42, height: 42, borderRadius: 21 },
  locationNote: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 16,
    backgroundColor: "#f8f8f6",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
  },
  nearbyPills: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  nearbyPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  mapPreview: {
    height: 116,
    borderRadius: 16,
    backgroundColor: "#f0f0ed",
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapRoad: {
    position: "absolute",
    width: "120%",
    height: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
    transform: [{ rotate: "-13deg" }],
  },
  mapRoadAlt: {
    width: "95%",
    height: 16,
    transform: [{ rotate: "28deg" }],
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  mapPin: {
    height: 28,
    borderRadius: 999,
    backgroundColor: "#111",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  descriptionBlock: {
    paddingTop: 1,
    paddingBottom: 4,
  },
  propertyIdRow: {
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stickyActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    ...shadow.strong,
  },
  stickyPill: {
    height: 48,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  messagePill: {
    flex: 0.9,
    gap: 6,
    backgroundColor: colors.black,
  },
  numberPill: {
    flex: 1.45,
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingLeft: 14,
    paddingRight: 6,
  },
  numberText: {
    flex: 1,
    minWidth: 0,
  },
  numberAction: {
    minWidth: 86,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
