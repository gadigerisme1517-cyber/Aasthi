import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { colour, weight as w } from "@/src/theme/tokens";

// THE AVATAR, FOR EVERY SURFACE.
//
// DEFAULT_AVATAR was a real Unsplash portrait of an identifiable person, and
// every account without a photo wore that same stranger's face — both sides
// of a message thread, the blocked list, the "Listed by" row. Two different
// people looked like one human being.
//
// A generated initial block instead: up to two initials from the display
// name, ink ground, white letters. No name at all gets a single neutral
// glyph, never a photograph of anybody.
//
// Uploaded photos are untouched: pass `uri` and it wins.

function initialsOf(name?: string): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "·";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  const out = `${first}${second}`.toUpperCase();
  return out || "·";
}

export function InitialAvatar({
  uri,
  name,
  size,
  // Matched to the surface: 16 on the storefront, 999 in a message thread.
  radius,
  fontSize,
  style,
}: {
  uri?: string;
  name?: string;
  size: number;
  radius: number;
  fontSize?: number;
  style?: any;
}) {
  const shared = { width: size, height: size, borderRadius: radius };
  if (uri) {
    return <Image source={{ uri }} style={[shared, style]} contentFit="cover" />;
  }
  return (
    <View style={[shared, styles.block, style]}>
      <T weight={w.title} size={fontSize ?? Math.round(size * 0.38)} color={colour.paper}>
        {initialsOf(name)}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colour.ink, alignItems: "center", justifyContent: "center" },
});
