import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { Field, PageHead, T } from "@/src/components/ui";
import { LOCATIONS, searchLocations } from "@/src/data/locations";
import { Icon } from "@/src/icons";
import { useApp } from "@/src/store/AppContext";
import { colors, shadow } from "@/src/theme";

export default function LocationPicker() {
  const router = useRouter();
  const { selectedLocation, setSelectedLocation } = useApp();
  const [query, setQuery] = useState("");

  const popular = useMemo(() => LOCATIONS.filter((location) => location.popular && location.id !== "all"), []);
  const results = useMemo(() => searchLocations(query), [query]);
  const visible = query.trim() ? results : [LOCATIONS[0], ...popular];

  return (
    <View style={styles.screen}>
      <PageHead title="Choose location" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.searchBox}>
          <Field value={query} onChangeText={setQuery} placeholder="Search city, town, mandal" autoFocus testID="location-search" />
        </View>

        <Pressable
          style={styles.currentCard}
          onPress={() => {
            setSelectedLocation(LOCATIONS[0]);
            router.back();
          }}
          testID="location-all"
        >
          <View style={styles.currentIcon}>
            <Icon name="mapPin" size={17} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <T weight={900} size={14}>All locations</T>
            <T weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2 }}>
              Show properties from every city for now
            </T>
          </View>
        </Pressable>

        <T weight={900} size={10} color={colors.faint} ls={0.7} style={styles.label}>
          {query.trim() ? "MATCHING LOCATIONS" : "POPULAR LOCATIONS"}
        </T>

        <View style={{ gap: 8 }}>
          {visible.map((location) => {
            const active = location.id === selectedLocation.id;
            return (
              <Pressable
                key={location.id}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => {
                  setSelectedLocation(location);
                  router.back();
                }}
                testID={`location-${location.id}`}
              >
                <View style={[styles.pin, active && styles.pinActive]}>
                  <Icon name={active ? "check" : "mapPin"} size={15} color={active ? colors.ink : colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <T weight={900} size={14}>{location.name}</T>
                  <T weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                    {location.type} - {location.district}, {location.state}
                  </T>
                </View>
                {active ? <T weight={900} size={11}>Selected</T> : <Icon name="chev" size={16} color={colors.faint} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  content: { padding: 18, paddingBottom: 40 },
  searchBox: { marginBottom: 10 },
  currentCard: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...shadow.soft,
  },
  currentIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { marginTop: 20, marginBottom: 9, textTransform: "uppercase" },
  row: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...shadow.soft,
  },
  rowActive: { borderColor: colors.black, backgroundColor: "#f8f8f5" },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  pinActive: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.black },
});