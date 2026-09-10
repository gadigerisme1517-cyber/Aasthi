import { useState } from "react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { useApp } from "@/src/store/AppContext";

export default function Gallery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const { listings } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  // Same de-dupe as /detail: older listings still store the cover inside `g`.
  const photos = [
    listing?.img,
    ...(listing?.g ?? []).filter((u) => u && u !== listing?.img),
  ].filter(Boolean) as string[];
  const startIndex = Math.max(0, Math.min(Number(index ?? 0) || 0, photos.length - 1));
  const [activeIndex, setActiveIndex] = useState(startIndex);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(next, photos.length - 1)));
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentOffset={{ x: startIndex * width, y: 0 }}
        style={StyleSheet.absoluteFill}
      >
        {photos.map((uri, photoIndex) => (
          <View key={`${uri}-${photoIndex}`} style={{ width, height }}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.closeButton} onPress={() => router.back()} testID="gallery-close">
          <Icon name="arrowLeft" size={18} color="#fff" />
        </Pressable>
        <T weight={900} size={13} color="#fff">
          {activeIndex + 1} / {photos.length}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
