import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CountPill, ResultCard } from "@/src/components/cards";
import { Empty, PageHead, Screen, SectionHead, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// Saved holds two different things now: properties (the heart on a listing)
// and stores (the Save button on a storefront).
//
// SEGMENTED CONTROL, not two stacked sections. A stacked section would put
// saved stores underneath a property list that has no upper bound, so a user
// with thirty shortlisted flats would never scroll far enough to find the two
// agents they saved — which is the same as not building it. The switch matches
// the one already on /my-enquiries, so it is a pattern, not a one-off.

type Tab = "properties" | "stores";

// A saved store key is a uid for a real agent and a numeric id for a seeded
// seller (BlockKey). Both are resolved to the same shape here.
//
// Three things only, all of them checkable: the name, the verified check
// AASTHI itself sets, and how many listings are live right now. The row used
// to carry a free-text line off `Seller.meta`, which is gone.
type StoreRow = {
  key: string | number;
  name: string;
  avatar?: string;
  verified: boolean;
  count: number;
  href?: string;
};

export default function Saved() {
  const router = useRouter();
  const { savedListings, savedSellers, toggleSaveSeller, sellers, listings, listingsBySeller } =
    useApp();
  const items = savedListings();

  const [tab, setTab] = useState<Tab>("properties");

  const storeRows: StoreRow[] = useMemo(
    () =>
      savedSellers.map((key) => {
        if (typeof key === "number") {
          const s = sellers.find((x) => x.id === key);
          const count = listingsBySeller(key).length;
          if (!s) {
            // Saved, but the seeded seller is no longer in the data. Say so
            // rather than inventing a name; Remove still works.
            return { key, name: "Store unavailable", verified: false, count: 0 };
          }
          return {
            key,
            name: s.name,
            avatar: s.img,
            verified: Boolean(s.verified),
            count,
            href: `/seller?id=${s.id}`,
          };
        }
        // A real agent. Identity comes off their listings, the same way
        // /seller reconstructs it — firestore.rules keeps users/{uid} readable
        // only by its owner, so there is nowhere else a buyer can read it from.
        const mine = listings.filter((l: any) => l.sellerUid === key);
        const first = mine[0] as any;
        if (!first) {
          // Nothing left to read a name off. The count pill says "No listings
          // yet", which is the whole story.
          return { key, name: "AASTHI member", verified: false, count: 0 };
        }
        return {
          key,
          name: first.sellerName?.trim() || "AASTHI member",
          avatar: first.sellerAvatar,
          verified: Boolean(first.sellerVerified),
          count: mine.length,
          href: `/seller?uid=${key}`,
        };
      }),
    [savedSellers, sellers, listings, listingsBySeller],
  );

  return (
    <Screen header={<PageHead title="Saved" onBack={() => router.push("/(tabs)")} />}>
      <View style={styles.switch}>
        {(["properties", "stores"] as Tab[]).map((t) => {
          const on = t === tab;
          const count = t === "properties" ? items.length : storeRows.length;
          return (
            <Pressable
              key={t}
              style={[styles.switchBtn, on && styles.switchBtnOn]}
              onPress={() => setTab(t)}
              testID={`saved-tab-${t}`}
            >
              <T weight={900} size={12} color={on ? colors.white : colors.ink}>
                {t === "properties" ? "Properties" : "Stores"}
                {count ? ` (${count})` : ""}
              </T>
            </Pressable>
          );
        })}
      </View>

      {tab === "properties" ? (
        <>
          <SectionHead title="Saved properties" sub="Your shortlisted listings." />
          {items.length ? (
            <View style={{ gap: 14 }}>
              {items.map((l) => (
                <ResultCard key={l.id} listing={l} onPress={() => router.push(`/detail?id=${l.id}`)} />
              ))}
            </View>
          ) : (
            <Empty title="No saved properties yet" body="Tap the heart on any listing to shortlist it." />
          )}
        </>
      ) : (
        <>
          <SectionHead title="Saved stores" sub="Agents and sellers you follow." />
          {storeRows.length ? (
            <View style={{ gap: 12 }}>
              {storeRows.map((row) => (
                <View key={String(row.key)} style={styles.storeRow}>
                  <Pressable
                    style={styles.storeMain}
                    disabled={!row.href}
                    onPress={() => row.href && router.push(row.href as any)}
                    testID={`saved-store-${row.key}`}
                  >
                    {row.avatar ? (
                      <Image source={{ uri: row.avatar }} style={styles.avatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: colors.soft2 }]} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.nameRow}>
                        <T weight={700} size={15} numberOfLines={1} style={{ flexShrink: 1 }}>
                          {row.name}
                        </T>
                        {row.verified ? <Icon name="check" size={15} color="#12a05e" /> : null}
                      </View>
                      {/* The same pill the seller cards use, not a lookalike
                          that can drift away from it. */}
                      <CountPill n={row.count} style={{ alignSelf: "flex-start", marginTop: 5, paddingHorizontal: 10 }} />
                    </View>
                  </Pressable>
                  {/* Without this a store you can no longer open would be
                      stuck in the list forever. */}
                  <Pressable
                    onPress={() => toggleSaveSeller(row.key)}
                    hitSlop={8}
                    testID={`saved-store-remove-${row.key}`}
                  >
                    <T weight={700} size={12} color={colors.muted}>
                      Remove
                    </T>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Empty
              title="No saved stores yet"
              body="Open an agent's store and tap Save to keep it here."
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderRadius: 999,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  switchBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnOn: { backgroundColor: colors.black },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    ...shadow.soft,
  },
  storeMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
});
