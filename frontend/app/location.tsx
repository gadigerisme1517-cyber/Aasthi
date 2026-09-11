import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { Field, PageHead, T } from "@/src/components/ui";
import { LOCATIONS, searchLocations } from "@/src/data/locations";
import { Icon } from "@/src/icons";
import { useApp } from "@/src/store/AppContext";
import { colour, weight as w } from "@/src/theme/tokens";

// A LIST, not a deck of cards.
//
// Every location used to be a white card with a shadow, a grey icon tile, a
// chevron and 8pt of air around it — six visible at a time on a list whose
// whole job is to let someone find their town fast. Plain rows with a
// hairline between them fit about twice that.
//
// "All locations" APPEARS ONCE. It used to be a black card at the top AND the
// first row of POPULAR LOCATIONS, the same option twice, with only the second
// copy showing the selected state. It is now just the first row, and it
// carries the tick like any other.

const ROW = 64;

export default function LocationPicker() {
  const router = useRouter();
  const { selectedLocation, setSelectedLocation } = useApp();
  const [query, setQuery] = useState("");

  const popular = useMemo(
    () => LOCATIONS.filter((location) => location.popular && location.id !== "all"),
    [],
  );
  const results = useMemo(() => searchLocations(query), [query]);
  const visible = query.trim() ? results : [LOCATIONS[0], ...popular];

  const choose = (location: (typeof LOCATIONS)[number]) => {
    setSelectedLocation(location);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <PageHead title="Choose location" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.searchBox}>
          <Field
            value={query}
            onChangeText={setQuery}
            placeholder="Search city, town, mandal"
            autoFocus
            testID="location-search"
          />
        </View>

        <T weight={w.title} size={10} color={colour.ink3} ls={0.7} style={styles.label}>
          {query.trim() ? "MATCHING LOCATIONS" : "POPULAR LOCATIONS"}
        </T>

        <View>
          {visible.map((location, i) => {
            const active = location.id === selectedLocation.id;
            const isAll = location.id === "all";
            return (
              <View key={location.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  style={styles.row}
                  onPress={() => choose(location)}
                  testID={`location-${location.id}`}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T weight={w.title} size={14.5} numberOfLines={1}>
                      {location.name}
                    </T>
                    <T
                      weight={w.body}
                      size={12}
                      color={colour.ink3}
                      numberOfLines={1}
                      style={{ marginTop: 3 }}
                    >
                      {isAll
                        ? "Show properties from every city"
                        : `${location.type} · ${location.district}, ${location.state}`}
                    </T>
                  </View>
                  {active ? <Icon name="check" size={17} color={colour.green} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {query.trim() && !visible.length ? (
          <T weight={w.body} size={13} color={colour.ink3} style={{ marginTop: 18 }}>
            Nothing matches that. Try the district or the mandal name.
          </T>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.paper },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  searchBox: { marginBottom: 6 },
  label: { marginTop: 14, marginBottom: 4, textTransform: "uppercase" },
  row: {
    minHeight: ROW,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  divider: { height: 1, backgroundColor: colour.line },
});
