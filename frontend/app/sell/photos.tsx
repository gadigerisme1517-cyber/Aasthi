import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Block, Button, PageHead, Screen, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function SellPhotos() {
  const router = useRouter();
  const { draft, setPhoto, photoLabels, showToast } = useApp();

  const pick = async (i: number) => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain) {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      if (!perm.granted) {
        showToast("Photo access needed. Open Settings to allow.");
        setTimeout(() => Linking.openSettings(), 600);
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) {
      setPhoto(i, res.assets[0].uri);
    }
  };

  return (
    <Screen header={<PageHead title="Photos & 360 Tour" onBack={() => router.back()} />}>
      <Block title="Photo Guide">
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 20 }}>
          Upload clear photos: front view, hall, kitchen, bedroom, road view and optional 360 tour.
        </T>
      </Block>

      <View style={styles.grid}>
        {photoLabels.map((label, i) => {
          const uri = draft.photos[i];
          return uri ? (
            <View key={label} style={styles.tile}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.tag}>
                <T weight={600} size={9} color="#fff">
                  {label}
                </T>
              </View>
              <Pressable style={styles.rm} onPress={() => setPhoto(i, null)} testID={`photo-remove-${i}`}>
                <Icon name="close" size={13} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable key={label} style={styles.tile} onPress={() => pick(i)} testID={`photo-add-${i}`}>
              <Icon name="camera" size={20} color={colors.muted} />
              <T weight={600} size={10} color={colors.muted} style={{ marginTop: 5, textAlign: "center" }}>
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        <MoreRow tag="Optional" title="Add Vastu Details" sub="Facing, entrance and room notes." onPress={() => router.push("/sell/vastu")} testID="photos-vastu" />
        <MoreRow tag="Premium" title="Add 360 Tour Link" sub="Paste your 360 tour link here." onPress={() => router.push("/sell/tour")} testID="photos-tour" />
      </View>

      <Button label="Preview Listing" onPress={() => router.push("/sell/preview")} style={{ marginTop: 14 }} testID="photos-preview" />
    </Screen>
  );
}

function MoreRow({ tag, title, sub, onPress, testID }: { tag: string; title: string; sub: string; onPress: () => void; testID: string }) {
  return (
    <Pressable style={styles.moreRow} onPress={onPress} testID={testID}>
      <View style={{ flex: 1 }}>
        <T weight={900} size={10} color="#8b8b8b" ls={0.6} style={{ textTransform: "uppercase", marginBottom: 5 }}>
          {tag}
        </T>
        <T weight={700} size={15}>
          {title}
        </T>
        <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4 }}>
          {sub}
        </T>
      </View>
      <Icon name="chev" size={18} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tile: {
    width: "31.6%",
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: "#f6f6f4",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.16)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tag: { position: "absolute", left: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  rm: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 28,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
});
