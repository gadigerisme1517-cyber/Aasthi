import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResultCard } from "@/src/components/cards";
import { Chips, Empty, SectionHead, T } from "@/src/components/ui";
import { CATEGORIES } from "@/src/data/seed";
import { listingMatchesLocation } from "@/src/data/locations";
import { Icon } from "@/src/icons";
import { colors, NAV_HEIGHT, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";
import { ScrollView } from "react-native";

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // browseListings, not listings: blocked sellers' properties must not appear.
  const { browseListings, selectedLocation } = useApp();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  // The placeholder has always said "Search {cat} in {location}" while the
  // filter ignored the location entirely. I changed the BEHAVIOUR to match
  // the copy rather than the copy to match the behaviour: Home already
  // location-filters, and a search that silently ignores the location the
  // user picked returns properties in other cities with no explanation.
  // "All locations" is a real option in the picker for anyone who wants the
  // unfiltered list.
  const inLocation = browseListings.filter((l) => listingMatchesLocation(l as any, selectedLocation));
  const base = inLocation.filter((l) => cat === "All" || l.type === cat);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? base.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.addr.toLowerCase().includes(query) ||
          l.type.toLowerCase().includes(query),
      )
    : base;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <T weight={800} size={20} ls={-1}>
          Search
        </T>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#202020" />
          <TextInput
            testID="search-input"
            value={q}
            onChangeText={setQ}
            placeholder={cat === "All" ? "Search city, area or property" : `Search ${cat} in ${selectedLocation.name}`}
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
          />
        </View>
        <Chips items={CATEGORIES} active={cat} onSelect={setCat} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: NAV_HEIGHT + insets.bottom + 28 }}
      >
        <SectionHead
          title={cat === "All" ? "Properties" : `${cat} properties`}
          sub={`Showing ${selectedLocation.name}. Change it from the home screen.`}
        />
        {filtered.length ? (
          <View style={{ gap: 14 }}>
            {filtered.map((l) => (
              <ResultCard key={l.id} listing={l} onPress={() => router.push(`/detail?id=${l.id}`)} />
            ))}
          </View>
        ) : (
          <Empty
            title="No properties found"
            body={`Nothing matches in ${selectedLocation.name}. Try a different search term, another category, or switch to All locations.`}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 10,
  },
  searchBar: {
    height: 58,
    borderRadius: 999,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 17,
    paddingRight: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadow.soft,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter-800",
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
});
