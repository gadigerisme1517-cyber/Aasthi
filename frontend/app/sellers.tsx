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
      {/* Was "Top responders and verified property professionals." Nothing in
          this app measures response time, so the first half was a claim with
          no source. What is left is true: these are the sellers AASTHI has
          verified, and what each of them currently has listed. */}
      <SectionHead
        title="Local seller network"
        sub="Sellers verified by AASTHI, and what they have listed."
      />
      <View style={{ gap: 14 }}>
        {sellers.map((s) => (
          <SellerWideCard
            key={s.id}
            seller={s}
            listings={listingsBySeller(s.id)}
            onPress={() => router.push(`/seller?id=${s.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
