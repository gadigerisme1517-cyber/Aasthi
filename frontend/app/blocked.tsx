import { useRouter } from "expo-router";
import { View } from "react-native";

import { Empty, PageHead, Screen, T } from "@/src/components/ui";
import { ResultCard } from "@/src/components/cards";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function Blocked() {
  const router = useRouter();
  const { blocked, listings, sellerOf, toggleBlock, showToast } = useApp();
  const items = listings.filter((l) => blocked.includes(l.seller));

  return (
    <Screen header={<PageHead title="Blocked sellers" onBack={() => router.back()} />}>
      {items.length ? (
        <View style={{ gap: 14, marginTop: 18 }}>
          <T weight={500} size={12} color={colors.muted}>
            Tap a listing to unblock that seller.
          </T>
          {items.map((l) => (
            <ResultCard
              key={l.id}
              listing={l}
              onPress={() => {
                const seller = sellerOf(l);
                toggleBlock(l.seller);
                showToast(`Unblocked ${seller?.name ?? "seller"}`);
              }}
            />
          ))}
        </View>
      ) : (
        <Empty title="No blocked sellers" body="Sellers you block from a listing or chat will appear here." />
      )}
    </Screen>
  );
}
