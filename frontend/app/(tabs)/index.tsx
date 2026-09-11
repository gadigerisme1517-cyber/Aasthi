import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeatureCard, ResultCard, SellerRailCard } from "@/src/components/cards";
import { CompactRow } from "@/src/components/compact-row";
import { GridTile } from "@/src/components/grid-tile";
import { Chips, Empty, SectionHead, T } from "@/src/components/ui";
import { CATEGORIES } from "@/src/data/seed";
import { listingMatchesLocation } from "@/src/data/locations";
import { Icon } from "@/src/icons";
import { colors, NAV_HEIGHT, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const HERO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // browseListings, not listings: blocked sellers' properties must not appear.
  // sellerOf is no longer needed here: the browse card carries no seller strip.
  const {
    browseListings,
    sellers,
    listingsBySeller,
    isSaved,
    toggleSave,
    iOwn,
    browseView,
    setBrowseView,
    selectedLocation,
  } = useApp();
  const [cat, setCat] = useState<string>("All");

  // Both guard the same thing from two places: the seller rail and the hero
  // stat must not render an empty strip or a zero.
  const hasSellers = sellers.length > 0;
  const verifiedSellerCount = sellers.filter((s) => s.verified).length;

  const locationFiltered = browseListings.filter((l) => listingMatchesLocation(l as any, selectedLocation));
  const filtered = locationFiltered.filter((l) => cat === "All" || l.type === cat);
  const visibleListings = filtered.length ? filtered : locationFiltered;
  const featured = visibleListings.slice(0, 2);
  const recent = visibleListings.slice(2);
  const emptyCopy = `We do not have listings in ${selectedLocation.name} right now. Try All locations or another nearby city.`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: NAV_HEIGHT + insets.bottom + 22 }}
      >
        <View style={styles.hero}>
          <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.62)"]}
            locations={[0, 0.36, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroInner, { paddingTop: insets.top + 12 }]}>
            <View style={styles.topRow}>
              <View style={styles.brandRow}>
                <View style={styles.mark}>
                  <T weight={700} size={16} color={colors.black}>A</T>
                </View>
                <View>
                  <T weight={700} size={11.5} color="#fff" ls={2.6}>AASTHI</T>
                  <T weight={600} size={10} color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
                    Simple property marketplace
                  </T>
                </View>
              </View>
              {/* The hero pill went with the sliders circle. It showed the
                  same location and opened the same picker as the chip in the
                  search row twenty points below it — two controls doing one
                  job, stacked. The chip is the single entry point now. */}
              <View style={styles.topActions}>
                <Pressable style={styles.bell} onPress={() => router.push("/notifications")} testID="home-bell">
                  <Icon name="bell" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroContent}>
              <T weight={700} size={9.5} color="rgba(255,255,255,0.74)" ls={1.2} style={{ textTransform: "uppercase" }}>
                For local Indian property buyers
              </T>
              <T weight={700} size={34} color="#fff" ls={-1.3} style={{ marginTop: 10, marginBottom: 9, lineHeight: 34 }}>
                Find property without confusion.
              </T>
              <T weight={600} size={13} color="rgba(255,255,255,0.8)" style={{ lineHeight: 18, maxWidth: 315 }}>
                Clear photos, price, seller details and location-based listings in one place.
              </T>
              {/* A stat is shown only when it has something to say. "0 verified
                  sellers" next to a live listing count is the first thing on
                  Home and reads as a broken app, so the tile is dropped
                  instead of printing a zero. */}
              <View style={styles.heroStats}>
                {[
                  { b: String(browseListings.length), s: "Listings" },
                  ...(verifiedSellerCount
                    ? [{ b: String(verifiedSellerCount), s: "Verified sellers" }]
                    : []),
                ].map((x) => (
                  <View key={x.s} style={styles.stat}>
                    <T weight={700} size={15} color="#fff">{x.b}</T>
                    <T weight={700} size={9} color="rgba(255,255,255,0.7)" numberOfLines={1} style={{ marginTop: 2 }}>
                      {x.s}
                    </T>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Pressable style={styles.search} onPress={() => router.push("/search")} testID="home-search">
            <Icon name="search" size={18} color="#202020" />
            <T weight={700} size={13} color="#202020" numberOfLines={1} style={{ flex: 1 }}>
              Search locality, seller or property
            </T>
            {/* WAS a black circle with a sliders icon that opened the LOCATION
                list. An icon that promises filters and delivers a city list is
                a lie about what the control does. It is a location chip now,
                and it is the ONLY way into the picker — the "Change" link on
                Featured Properties went with it. */}
            <Pressable
              style={styles.locChip}
              onPress={() => router.push("/location")}
              testID="home-location-chip"
              hitSlop={6}
            >
              <Icon name="mapPin" size={12} color={colors.ink} />
              <T weight={600} size={12} color={colors.ink} numberOfLines={1} style={{ maxWidth: 96 }}>
                {selectedLocation.name}
              </T>
              <Icon name="chevDown" size={12} color={colors.muted} />
            </Pressable>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          {/* The chips get the WHOLE width back. The toggle used to sit in
              this row and stole about 100pt from Buy/Rent/Plots/Commercial,
              which is why the chip strip could not scroll cleanly. */}
          <Chips items={CATEGORIES} active={cat} onSelect={setCat} />

          {/* The toggle sits OPPOSITE the section title, on the same line —
              it belongs to the list below it, and a control floating on its
              own line belongs to nothing. */}
          <SectionHead
            title="Featured Properties"
            sub={`Showing ${selectedLocation.name} properties.`}
            right={
              <View style={styles.viewToggle}>
                {(["card", "compact", "grid"] as const).map((v) => {
                  const on = browseView === v;
                  return (
                    <Pressable
                      key={v}
                      style={[styles.viewBtn, on && styles.viewBtnOn]}
                      onPress={() => setBrowseView(v)}
                      // The box shrank; the TARGET did not. 24 + 8 on every
                      // side is 40, which is the floor for a thumb.
                      hitSlop={8}
                      testID={`view-${v}`}
                    >
                      <Icon
                        name={v === "card" ? "square" : v === "compact" ? "rows" : "grid"}
                        size={14}
                        color={on ? colors.white : colors.muted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            }
          />
          {visibleListings.length ? (
            <View style={browseView === "grid" ? styles.grid : undefined}>
            {featured.map((l) =>
              // ONE save handler and ONE ownership guard, whichever view is on.
              browseView === "grid" ? (
                <GridTile
                  key={l.id}
                  listing={l}
                  saved={isSaved(l.id)}
                  onPress={() => router.push(`/detail?id=${l.id}`)}
                  onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                />
              ) : browseView === "compact" ? (
                <CompactRow
                  key={l.id}
                  listing={l}
                  saved={isSaved(l.id)}
                  onPress={() => router.push(`/detail?id=${l.id}`)}
                  onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                />
              ) : (
                <FeatureCard
                  key={l.id}
                  listing={l}
                  saved={isSaved(l.id)}
                  onPress={() => router.push(`/detail?id=${l.id}`)}
                  // No heart on a property you published. Ownership, not mode.
                  onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                />
              ),
            )}
            </View>
          ) : (
            <Empty title="No properties here yet" body={emptyCopy} />
          )}

          <View style={styles.editorial}>
            <T weight={700} size={9.5} color="#8c7555" ls={1.1} style={{ textTransform: "uppercase" }}>
              Why AASTHI
            </T>
            <T weight={700} size={20} ls={-0.7} style={{ marginTop: 9 }}>
              Simple. Trusted. Easy to contact.
            </T>
            <T weight={500} size={12} color="#6b665f" style={{ marginTop: 8, lineHeight: 17 }}>
              AASTHI keeps the property page simple: big photos, clear price, location, seller details and direct inquiry.
            </T>
          </View>

          {/* THE WHOLE SECTION GOES when there are no sellers - heading,
              sub and the "View all" link with it. A header over an empty
              strip advertises a screen with nothing on it.
              Title kept otherwise: every card in this rail carries the
              verified check, so it describes what is there. The sub said
              "quick response", which nothing in this app measures. */}
          {hasSellers ? (
            <SectionHead
              title="Verified Sellers"
              sub="Verified sellers and what they have listed."
              link="View all"
              onLink={() => router.push("/sellers")}
            />
          ) : null}
        </View>
        {/* Same condition, second time only because the rail scrolls edge to
            edge and so cannot sit inside the padded View above. */}
        {hasSellers ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 6 }}
          >
            {sellers.map((s) => (
              <SellerRailCard
                key={s.id}
                seller={s}
                listings={listingsBySeller(s.id)}
                onPress={() => router.push(`/seller?id=${s.id}`)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={{ paddingHorizontal: 18 }}>
          <Pressable style={styles.nativeSpot} onPress={() => router.push("/sell/boost")} testID="home-promoted">
            <T weight={700} size={9.5} color="#b9b9b9" ls={1.1} style={{ textTransform: "uppercase" }}>
              Promoted Property
            </T>
            <T weight={700} size={18} color="#fff" ls={-0.5} style={{ marginTop: 6 }}>
              Get more views on your property.
            </T>
            <T weight={500} size={12} color="#c7c7c7" style={{ marginTop: 5, lineHeight: 17 }}>
              Paid listings appear neatly inside the app without disturbing users.
            </T>
            <View style={styles.spotBtn}>
              <T weight={700} size={11} color={colors.ink}>View promotion</T>
            </View>
          </Pressable>

          <SectionHead title="New Properties" sub={`Recently added in ${selectedLocation.name}.`} />
          {recent.length ? (
            <View style={browseView === "grid" ? styles.grid : browseView === "compact" ? undefined : { gap: 10 }}>
              {recent.map((l) =>
                browseView === "grid" ? (
                  <GridTile
                    key={l.id}
                    listing={l}
                    saved={isSaved(l.id)}
                    onPress={() => router.push(`/detail?id=${l.id}`)}
                    onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                  />
                ) : browseView === "compact" ? (
                  <CompactRow
                    key={l.id}
                    listing={l}
                    saved={isSaved(l.id)}
                    onPress={() => router.push(`/detail?id=${l.id}`)}
                    onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                  />
                ) : (
                  <ResultCard
                    key={l.id}
                    listing={l}
                    saved={isSaved(l.id)}
                    onPress={() => router.push(`/detail?id=${l.id}`)}
                    onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                  />
                ),
              )}
            </View>
          ) : visibleListings.length ? null : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  locChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
    backgroundColor: colors.soft,
  },
  viewToggle: { flexDirection: "row", gap: 4, alignItems: "center" },
  // Two columns with the same 10 gap the storefront grid uses.
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  // SIZED OFF THE HEADING, not off a round number. "Featured Properties" is
  // Inter-700 at 20, whose cap height is 0.727em = 14.5. The ICON is 14, so
  // the glyph stands exactly as tall as the letters beside it. The box is
  // that plus 5 of padding a side = 24.
  //
  // UNSELECTED BUTTONS HAVE NO GROUND. Three filled grey boxes read as a
  // button bar, which is heavier than the heading they sit next to; with
  // only the selected one filled, exactly one solid shape exists at a time
  // and the other two are just glyphs on the page.
  viewBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  viewBtnOn: { backgroundColor: colors.black },
  hero: { minHeight: 330, backgroundColor: "#111" },
  heroInner: { flex: 1, paddingHorizontal: 18, paddingBottom: 34 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: { marginTop: 26 },
  heroStats: { flexDirection: "row", gap: 7, marginTop: 18 },
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  searchWrap: { paddingHorizontal: 18, marginTop: -22, marginBottom: 10, zIndex: 5 },
  search: {
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.98)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingLeft: 14,
    paddingRight: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    ...shadow.strong,
  },
  editorial: {
    borderRadius: 22,
    backgroundColor: colors.warm,
    padding: 15,
    marginTop: 2,
    marginBottom: 2,
  },
  nativeSpot: {
    borderRadius: radius.card,
    padding: 15,
    backgroundColor: "#111",
    marginVertical: 14,
    ...shadow.strong,
  },
  spotBtn: {
    marginTop: 10,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});