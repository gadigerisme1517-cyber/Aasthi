import { useLocalSearchParams, useRouter } from "expo-router";

import { Block, PageHead, Screen, T } from "@/src/components/ui";
import { colors } from "@/src/theme";

export default function Vastu() {
  const router = useRouter();
  useLocalSearchParams();
  return (
    <Screen header={<PageHead title="Vastu Details" onBack={() => router.back()} />}>
      <Block title="Seller Notes" style={{ marginTop: 18 }}>
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 22 }}>
          East-facing entrance, southeast kitchen, northeast puja room and strong morning light in hall.
        </T>
      </Block>
    </Screen>
  );
}
