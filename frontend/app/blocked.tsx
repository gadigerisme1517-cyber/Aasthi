import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Empty, PageHead, Screen, SectionHead, T } from "@/src/components/ui";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// Lists BLOCKED SELLERS, not their listings.
//
// It used to render `listings.filter(l => blocked.includes(l.seller))`, which
// meant a blocked seller holding zero live listings appeared nowhere here and
// could never be unblocked. It also could not show a private publisher at
// all, because blocked only held seeded numeric ids.

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

export default function Blocked() {
  const router = useRouter();
  const { blocked, listings, sellers, sellerOf, toggleBlock, showToast } = useApp();

  // One row per blocked key, whether or not that seller still has listings.
  const rows = blocked.map((key) => {
    const theirListings = listings.filter(
      (l) => (typeof key === "string" ? (l as any).sellerUid : l.seller) === key,
    );

    if (typeof key === "number") {
      const seeded = sellers.find((s) => s.id === key);
      return {
        key,
        name: seeded?.name ?? `Seller ${key}`,
        meta: seeded?.meta ?? "This seller is no longer listed on AASTHI.",
        img: seeded?.img ?? DEFAULT_AVATAR,
        count: theirListings.length,
        openable: Boolean(seeded),
        href: `/seller?id=${key}`,
      };
    }

    // A uid seller's name lives on their listings. With none left there is
    // nothing to read it from, so say so rather than invent a name.
    const anyListing = theirListings[0];
    const resolved = anyListing ? sellerOf(anyListing) : undefined;
    return {
      key,
      name: resolved?.name ?? "Private seller",
      meta: resolved?.meta ?? "No listings left to show their details.",
      img: resolved?.img ?? DEFAULT_AVATAR,
      count: theirListings.length,
      openable: Boolean(anyListing),
      href: `/seller?uid=${key}`,
    };
  });

  return (
    <Screen header={<PageHead title="Blocked sellers" onBack={() => router.back()} />}>
      <SectionHead
        title="Sellers you have blocked"
        sub="Their properties are hidden from Home, Search and Saved."
      />

      {rows.length ? (
        <View style={{ gap: 12 }}>
          {rows.map((row) => (
            <View key={String(row.key)} style={styles.row} testID={`blocked-${row.key}`}>
              <Image source={{ uri: row.img }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <T weight={800} size={14.5} numberOfLines={1}>
                  {row.name}
                </T>
                <T weight={500} size={11.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                  {row.meta}
                </T>
                <T weight={700} size={11} color={colors.faint} style={{ marginTop: 4 }}>
                  {row.count === 0
                    ? "No live listings"
                    : row.count === 1
                      ? "1 listing hidden"
                      : `${row.count} listings hidden`}
                </T>
              </View>
              <Pressable
                style={styles.unblock}
                onPress={() => {
                  toggleBlock(row.key);
                  showToast(`Unblocked ${row.name}`);
                }}
                testID={`unblock-${row.key}`}
              >
                <T weight={900} size={11.5} color={colors.white}>
                  Unblock
                </T>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Empty
          title="No blocked sellers"
          body="Open a seller from any listing and tap Block this seller to hide their properties."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    ...shadow.soft,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  unblock: {
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.black,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
