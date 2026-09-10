import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

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
  const { id, uid } = useLocalSearchParams<{ id?: string; uid?: string }>();
  const { sellers, listings, listingsBySeller, sellerOf, blocked, toggleBlock, showToast } = useApp();

  // Two kinds of seller reach this screen. A seeded one is looked up by its
  // numeric id. A real publisher has no numeric id — it is identified by uid,
  // and its profile is reconstructed from its own listings, because
  // firestore.rules:32 forbids reading another user's users/{uid} document.
  const userListings = uid ? listings.filter((l) => (l as any).sellerUid === uid) : [];
  const seller = uid
    ? userListings.length
      ? sellerOf(userListings[0])
      : undefined
    : sellers.find((s) => s.id === Number(id));
  const mine = uid ? userListings : listingsBySeller(seller?.id ?? -999);
  // The block key is the uid for a private publisher, the numeric id for a
  // seeded seller. Both live in the same users/{uid}.blocked array.
  const blockKey = uid ?? seller?.id;
  const isBlocked = blockKey !== undefined && blocked.includes(blockKey);

  if (!seller) {
    return (
      <Screen header={<PageHead title="Seller" onBack={() => router.back()} />}>
        <Empty title="Seller not found" body="This seller may have been removed." />
      </Screen>
    );
  }

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

      {/* Restored for private publishers. users.blocked now holds uids as
          well as the seeded numeric ids, so this works for both. */}
      {blockKey !== undefined ? (
        <Pressable
          style={styles.blockRow}
          onPress={() => {
            toggleBlock(blockKey);
            showToast(isBlocked ? `Unblocked ${seller.name}` : `Blocked ${seller.name}`);
          }}
          testID="seller-block-toggle"
        >
          <T weight={700} size={12} color={isBlocked ? colors.ink : colors.red}>
            {isBlocked ? "Unblock this seller" : "Block this seller"}
          </T>
        </Pressable>
      ) : null}

      <View style={styles.facts}>
        <Fact b={seller.sold} label="sold" />
        <Fact b={seller.rating} label="rating" />
        <Fact b={mine.length} label="listings" />
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
  blockRow: { alignSelf: "flex-start", marginTop: 10 },
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
