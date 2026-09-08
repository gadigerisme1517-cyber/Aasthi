import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Listing, Seller } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { T } from "@/src/components/ui";

function Fact({ b, label }: { b: string; label: string }) {
  return (
    <View style={styles.fact}>
      <T weight={800} size={12.5}>
        {b}
      </T>
      <T weight={850} size={9} color={colors.muted} style={{ marginTop: 1 }}>
        {label}
      </T>
    </View>
  );
}

export function FeatureCard({
  listing,
  seller,
  saved,
  onPress,
  onToggleSave,
  preview,
}: {
  listing: Listing;
  seller: Seller;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
  preview?: boolean;
}) {
  return (
    <Pressable
      style={styles.feature}
      onPress={onPress}
      testID={`feature-card-${listing.id}`}
    >
      <View style={styles.featureImageWrap}>
        <Image source={{ uri: listing.img }} style={styles.featureImage} contentFit="cover" transition={200} />
        <View style={styles.featureTop}>
          <View style={styles.badge}>
            <T weight={900} size={9.5} ls={0.4} style={{ textTransform: "uppercase" }}>
              {listing.type}
              {seller.verified ? " · verified" : ""}
            </T>
          </View>
          {!preview ? (
            <Pressable
              style={styles.save}
              onPress={onToggleSave}
              testID={`save-${listing.id}`}
              hitSlop={8}
            >
              <Icon name="heart" size={17} color={saved ? colors.red : colors.ink} filled={saved} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.featureContent}>
        <T weight={900} size={25} ls={-1}>
          {listing.price}
        </T>
        <T weight={700} size={17} ls={-0.5} style={{ marginTop: 5, marginBottom: 5 }}>
          {listing.title}
        </T>
        <T weight={500} size={12} color="#5f5f62">
          {listing.addr}
        </T>
        <View style={styles.factGlass}>
          <Fact b={listing.beds} label="Beds" />
          <Fact b={listing.baths} label="Baths" />
          <Fact b={listing.area} label="Area" />
          <Fact b={listing.facing} label="Facing" />
        </View>
        <View style={styles.agentStrip}>
          <View style={styles.agentLeft}>
            <Image source={{ uri: seller.img }} style={styles.agentImg} />
            <View style={{ flex: 1 }}>
              <T weight={700} size={12} numberOfLines={1}>
                {seller.name}
              </T>
              <T weight={500} size={10.5} color="#6f6f72" numberOfLines={1} style={{ marginTop: 1 }}>
                {seller.meta}
              </T>
            </View>
          </View>
          <View style={styles.openBtn}>
            <T weight={900} size={11} color={colors.white}>
              {preview ? "Preview" : "View"}
            </T>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function ResultCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.result} onPress={onPress} testID={`result-card-${listing.id}`}>
      <Image source={{ uri: listing.img }} style={styles.resultImg} contentFit="cover" transition={150} />
      <View style={{ flex: 1, paddingVertical: 3, paddingRight: 5 }}>
        <T weight={900} size={9.5} ls={0.5} color="#8b8b8b" style={{ textTransform: "uppercase", marginBottom: 4 }}>
          {listing.type} · {listing.facing} facing
        </T>
        <T weight={900} size={17} ls={-0.5}>
          {listing.price}
        </T>
        <T weight={700} size={13.5} numberOfLines={2} style={{ marginVertical: 4 }}>
          {listing.title}
        </T>
        <T weight={500} size={11} color={colors.muted} numberOfLines={1} style={{ marginBottom: 6 }}>
          {listing.addr}
        </T>
        <View style={styles.tinyFacts}>
          {[`${listing.beds} Beds`, `${listing.baths} Baths`, listing.area].map((t) => (
            <View key={t} style={styles.tinyFact}>
              <T weight={850} size={9.5} color="#4a4a4d">
                {t}
              </T>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
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
  feature: {
    marginBottom: 16,
    borderRadius: radius.feature,
    overflow: "hidden",
    backgroundColor: "#111",
    ...shadow.card,
  },
  featureImageWrap: { height: 340, backgroundColor: "#ddd" },
  featureImage: { width: "100%", height: "100%" },
  featureTop: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    height: 29,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    ...shadow.card,
  },
  factGlass: { flexDirection: "row", gap: 6, marginTop: 10 },
  fact: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  agentStrip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  agentLeft: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 },
  agentImg: { width: 32, height: 32, borderRadius: 16 },
  openBtn: {
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.black,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
    flexDirection: "row",
    gap: 9,
    padding: 7,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft,
  },
  resultImg: { width: 112, height: 118, borderRadius: 16 },
  tinyFacts: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tinyFact: {
    borderRadius: 999,
    backgroundColor: "#f1f1ef",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  sellerMini: {
    width: 136,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    ...shadow.soft,
  },
  cover: { height: 88, borderRadius: 16, overflow: "hidden", backgroundColor: "#ddd" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: -19,
    marginLeft: 9,
  },
  sellerNums: { flexDirection: "row", gap: 5 },
  numBox: {
    flex: 1,
    borderRadius: 11,
    backgroundColor: colors.soft,
    padding: 6,
    alignItems: "center",
  },
  sellerWide: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft,
  },
  wideCover: { width: 80, height: 80, borderRadius: 16 },
});
