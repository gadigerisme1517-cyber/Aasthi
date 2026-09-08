import { useRouter } from "expo-router";
import { View } from "react-native";

import { Empty, PageHead, Screen } from "@/src/components/ui";
import { ResultCard } from "@/src/components/cards";
import { useApp } from "@/src/store/AppContext";

export default function Blocked() {
  const router = useRouter();
  const { blocked, listings, showToast } = useApp();
  const items = listings.filter((l) => blocked.includes(l.seller));

  return (
    <Screen header={<PageHead title="Blocked sellers" onBack={() => router.back()} />}>
      {items.length ? (
        <View style={{ gap: 14, marginTop: 18 }}>
          {items.map((l) => (
            <ResultCard key={l.id} listing={l} onPress={() => showToast("Seller is blocked")} />
          ))}
        </View>
      ) : (
        <Empty title="No blocked sellers" body="Sellers you block from a listing or chat will appear here." />
      )}
    </Screen>
  );
}
