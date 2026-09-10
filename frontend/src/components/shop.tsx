import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";

// The shop front, shared by /(tabs)/profile (the owner's own view) and
// /seller (what a buyer sees). Both must show the SAME cover, identity,
// badges and stats, or the seller cannot trust what their shop looks like.
//
// Every value here is passed in already computed. This component invents
// nothing: an unknown stat renders "-", and a badge with no data behind it
// renders nothing at all.

export type ShopStat = { value: string; label: string };

export function ShopCover({ uri, onEdit }: { uri?: string; onEdit?: () => void }) {
  return (
    <View style={styles.cover}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        // A plain block, never a stock photograph. Showing a house this
        // seller does not have would be the app telling a lie on their behalf.
        <View style={[StyleSheet.absoluteFill, styles.coverEmpty]} />
      )}
      {onEdit ? (
        <Pressable style={styles.coverEdit} onPress={onEdit} testID="shop-edit-cover">
          <Icon name="camera" size={15} color="#fff" />
          <T weight={900} size={10.5} color="#fff">
            Edit
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ShopIdentity({
  avatar,
  name,
  businessName,
  city,
  verified,
  reraId,
}: {
  avatar?: string;
  name: string;
  businessName?: string;
  city?: string;
  verified?: boolean;
  reraId?: string;
}) {
  return (
    <View style={styles.identity}>
      <View style={styles.idRow}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.coverEmpty]} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <T weight={800} size={19} ls={-0.6} numberOfLines={1}>
            {name}
          </T>
          {businessName ? (
            <T weight={700} size={12.5} color={colors.ink} numberOfLines={1} style={{ marginTop: 2 }}>
              {businessName}
            </T>
          ) : null}
          {city ? (
            <T weight={500} size={12} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
              {city}
            </T>
          ) : null}
        </View>
      </View>

      {/* Badges are evidence, not decoration. No grey "unverified" pill —
          absence is the signal, and a pill saying a seller is NOT verified
          would be a claim the app has not earned either. */}
      {verified || reraId ? (
        <View style={styles.badgeRow}>
          {verified ? (
            <View style={[styles.badge, { backgroundColor: colors.green }]} testID="shop-badge-verified">
              <Icon name="check" size={12} color="#fff" />
              <T weight={900} size={10.5} color="#fff">
                Verified
              </T>
            </View>
          ) : null}
          {reraId ? (
            <View style={[styles.badge, styles.badgeOutline]} testID="shop-badge-rera">
              <T weight={900} size={10.5} color={colors.ink}>
                RERA {reraId}
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ShopStats({ stats }: { stats: ShopStat[] }) {
  return (
    <View style={styles.stats}>
      {stats.map((s) => (
        <View key={s.label} style={styles.stat}>
          <T weight={900} size={19} ls={-0.5} numberOfLines={1}>
            {s.value}
          </T>
          <T weight={800} size={10} color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
            {s.label}
          </T>
        </View>
      ))}
    </View>
  );
}

export function ShopTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onSelect: (k: string) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            style={[styles.tab, on && styles.tabOn]}
            onPress={() => onSelect(t.key)}
            testID={`shop-tab-${t.key}`}
          >
            <T weight={900} size={12} color={on ? colors.white : colors.ink}>
              {t.label}
              {typeof t.count === "number" && t.count > 0 ? ` (${t.count})` : ""}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// "Member since" from an epoch ms that may not exist. Returns a dash rather
// than guessing, per the no-invented-data rule.
export function memberSince(createdAt?: number): string {
  if (!createdAt) return "-";
  return new Date(createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  cover: {
    height: 132,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.soft,
    marginTop: 8,
  },
  coverEmpty: { backgroundColor: colors.soft2 },
  coverEdit: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  identity: { marginTop: 14 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 11,
  },
  badgeOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  stats: { flexDirection: "row", gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...shadow.soft,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderRadius: 999,
    padding: 4,
    marginTop: 18,
    gap: 4,
  },
  tab: { flex: 1, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: colors.black },
});
