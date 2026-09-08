import { useRouter } from "expo-router";
import { View } from "react-native";

import { SellerWideCard } from "@/src/components/cards";
import { PageHead, Screen, SectionHead } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Sellers() {
  const router = useRouter();
  const { sellers, listingsBySeller } = useApp();

  return (
    <Screen header={<PageHead title="Verified sellers" onBack={() => router.back()} />}>
      <SectionHead
        title="Local seller network"
        sub="Top responders and verified property professionals."
      />
      <View style={{ gap: 14 }}>
        {sellers.map((s) => (
          <SellerWideCard
            key={s.id}
            seller={s}
            count={listingsBySeller(s.id).length}
            onPress={() => router.push(`/seller?id=${s.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
