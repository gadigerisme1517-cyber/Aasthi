import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ResultCard } from "@/src/components/cards";
import { Block, Empty, PageHead, Screen, SectionHead, T, TrustTag } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

function Fact({ b, label }: { b: string | number; label: string }) {
  return (
    <View style={styles.fact}>
      <T weight={800} size={19}>
        {String(b)}
      </T>
      <T weight={850} size={10.5} color={colors.muted} style={{ marginTop: 3 }}>
        {label}
      </T>
    </View>
  );
}

export default function SellerDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sellers, listingsBySeller } = useApp();
  const seller = sellers.find((s) => s.id === Number(id)) ?? sellers[0];
  const mine = listingsBySeller(seller.id);

  return (
    <Screen header={<PageHead title="Seller" onBack={() => router.back()} />}>
      <Block style={{ marginTop: 18 }}>
        <View style={styles.wide}>
          <View style={styles.left}>
            <Image source={{ uri: seller.img }} style={styles.img} />
            <View style={{ flex: 1 }}>
              <T weight={700} size={15}>
                {seller.name}
              </T>
              <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }} numberOfLines={1}>
                {seller.meta}
              </T>
            </View>
          </View>
          <TrustTag label={seller.trust} />
        </View>
      </Block>

      <View style={styles.facts}>
        <Fact b={seller.sold} label="Sold" />
        <Fact b={seller.rating} label="Rating" />
        <Fact b={mine.length} label="Listings" />
      </View>

      <SectionHead title="Listings" sub="Properties from this seller." />
      {mine.length ? (
        <View style={{ gap: 14 }}>
          {mine.map((l) => (
            <ResultCard key={l.id} listing={l} onPress={() => router.push(`/detail?id=${l.id}`)} />
          ))}
        </View>
      ) : (
        <Empty title="No active listings" body="This seller has no live properties right now." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  img: { width: 54, height: 54, borderRadius: 27 },
  facts: { flexDirection: "row", gap: 8, marginTop: 14 },
  fact: {
    flex: 1,
    height: 74,
    borderRadius: 22,
    backgroundColor: "#f7f7f5",
    alignItems: "center",
    justifyContent: "center",
  },
});
