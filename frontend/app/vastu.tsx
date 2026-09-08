import { useLocalSearchParams, useRouter } from "expo-router";

import { Block, Empty, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function Vastu() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings } = useApp();
  const listing = listings.find((l) => l.id === id);

  return (
    <Screen header={<PageHead title="Vastu Details" onBack={() => router.back()} />}>
      {listing ? (
        <>
          <Block title="Facing" style={{ marginTop: 18 }}>
            <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 22 }}>
              {listing.facing ? `${listing.facing}-facing entrance.` : "Not specified by the seller."}
            </T>
          </Block>
          <Block title="Seller Notes" style={{ marginTop: 14 }}>
            <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 22 }}>
              {listing.vastu?.trim() || "The seller hasn't added Vastu details for this property yet."}
            </T>
          </Block>
        </>
      ) : (
        <Empty title="Listing not found" body="This property may have been removed." />
      )}
    </Screen>
  );
}
