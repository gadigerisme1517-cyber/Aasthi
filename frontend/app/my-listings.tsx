import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Empty,
  ListingStatusTag,
  PageHead,
  Screen,
  SectionHead,
  T,
} from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// Every listing whose sellerUid is the signed-in user. Nothing in the app
// showed a user their own properties before this, even though /help told them
// they could open one from their profile and edit it.
//
// Note this deliberately keys on sellerUid, not on the numeric `seller`
// field: listings published before the identity fix carry sellerUid but were
// attributed to seed seller 0.

export default function MyListings() {
  const router = useRouter();
  const { myListings } = useApp();

  return (
    <Screen header={<PageHead title="My listings" onBack={() => router.back()} />}>
      <SectionHead
        title="Properties you have listed"
        sub={
          myListings.length === 1
            ? "1 property. Tap to edit or remove it."
            : `${myListings.length} properties. Tap one to edit or remove it.`
        }
      />

      {myListings.length ? (
        <View style={{ gap: 12 }}>
          {myListings.map((l) => (
            <Pressable
              key={l.id}
              style={styles.row}
              testID={`my-listing-${l.id}`}
              onPress={() => router.push(`/edit-listing?id=${l.id}`)}
            >
              <Image source={{ uri: l.img }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <T weight={900} size={9.5} ls={0.5} color="#8b8b8b" style={styles.eyebrow}>
                  {l.type} · {l.facing} facing
                </T>
                <T weight={900} size={16} ls={-0.5}>
                  {l.price}
                </T>
                <T weight={700} size={13} numberOfLines={2} style={{ marginVertical: 4 }}>
                  {l.title}
                </T>
                <T weight={500} size={11} color={colors.muted} numberOfLines={1}>
                  {l.addr}
                </T>
                <View style={{ marginTop: 8 }}>
                  <ListingStatusTag status={(l as any).verificationStatus} />
                </View>
              </View>
              <Icon name="chev" size={16} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty
          title="You have not listed a property yet"
          body="Tap List on the bottom bar to publish your first property. It will appear here with its verification status."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    ...shadow.soft,
  },
  thumb: { width: 86, height: 86, borderRadius: 16 },
  eyebrow: { textTransform: "uppercase", marginBottom: 4 },
});
