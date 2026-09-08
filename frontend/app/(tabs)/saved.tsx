import { useRouter } from "expo-router";
import { View } from "react-native";

import { ResultCard } from "@/src/components/cards";
import { Empty, PageHead, Screen, SectionHead } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Saved() {
  const router = useRouter();
  const { savedListings } = useApp();
  const items = savedListings();

  return (
    <Screen header={<PageHead title="Saved" onBack={() => router.push("/(tabs)")} />}>
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
    </Screen>
  );
}
