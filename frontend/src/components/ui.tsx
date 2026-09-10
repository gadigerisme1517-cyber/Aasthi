import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font, NAV_HEIGHT, radius, shadow } from "@/src/theme";
import { Icon, IconName } from "@/src/icons";
import { useApp } from "@/src/store/AppContext";

function familyFor(w?: number): string {
  if (!w || w <= 400) return font.regular;
  if (w <= 500) return font.medium;
  if (w <= 650) return font.semibold;
  if (w < 800) return font.bold;
  if (w < 900) return font.extrabold;
  return font.black;
}

export function T({
  children,
  weight,
  size = 14,
  color = colors.ink,
  style,
  numberOfLines,
  ls,
}: {
  children: React.ReactNode;
  weight?: number;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  ls?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: familyFor(weight),
          fontSize: size,
          color,
          letterSpacing: ls ?? -0.2,
        },
        style as any,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  dark = false,
  contentStyle,
  keyboard = false,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  dark?: boolean;
  contentStyle?: ViewStyle;
  keyboard?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: 18,
          paddingBottom: NAV_HEIGHT + insets.bottom + 22,
        },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: 18 }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: dark ? colors.darkBg : colors.screen }}
    >
      {header}
      {keyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={insets.top + 60}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
      {footer}
    </View>
  );
}

export function PageHead({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[styles.pageHead, { paddingTop: insets.top + 8 }]}
    >
      <Pressable
        testID="back-button"
        onPress={onBack ?? (() => router.back())}
        style={styles.circle}
        hitSlop={8}
      >
        <Icon name="arrowLeft" size={18} color={colors.ink} />
      </Pressable>
      <T weight={800} size={18} ls={-0.6} style={{ flex: 1 }}>
        {title}
      </T>
      {right}
    </BlurView>
  );
}

export function Button({
  label,
  onPress,
  variant = "black",
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: "black" | "light" | "red";
  style?: ViewStyle;
  testID?: string;
}) {
  const bg =
    variant === "black"
      ? colors.black
      : variant === "red"
        ? colors.red
        : colors.soft;
  const fg = variant === "light" ? colors.ink : colors.white;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <T weight={900} size={13} color={fg}>
        {label}
      </T>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  testID,
  autoFocus,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  testID?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.field}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize="none"
        style={styles.fieldInput}
      />
    </View>
  );
}

export function Textarea({
  value,
  onChangeText,
  placeholder,
  testID,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  return (
    <View style={styles.textarea}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        multiline
        style={[styles.fieldInput, { height: 92, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function Chips({
  items,
  active,
  onSelect,
  dark = false,
}: {
  items: readonly string[];
  active: string;
  onSelect: (v: string) => void;
  dark?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {items.map((it) => {
        const on = it === active;
        return (
          <Pressable
            key={it}
            testID={`chip-${it}`}
            onPress={() => onSelect(it)}
            style={[
              styles.chip,
              dark && styles.chipDark,
              on && (dark ? styles.chipDarkOn : styles.chipOn),
            ]}
          >
            <T
              weight={850}
              size={12}
              color={on ? (dark ? colors.ink : colors.white) : dark ? colors.white : colors.ink}
            >
              {it}
            </T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SectionHead({
  title,
  sub,
  link,
  onLink,
}: {
  title: string;
  sub?: string;
  link?: string;
  onLink?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <T weight={800} size={20} ls={-0.7}>
          {title}
        </T>
        {sub ? (
          <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4 }}>
            {sub}
          </T>
        ) : null}
      </View>
      {link ? (
        <Pressable onPress={onLink} testID={`link-${link}`}>
          <T weight={900} size={13}>
            {link}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <T
      weight={900}
      size={10}
      color={colors.faint}
      ls={0.6}
      style={{ marginTop: 18, marginBottom: 8, textTransform: "uppercase" }}
    >
      {children}
    </T>
  );
}

export function Block({
  title,
  children,
  style,
}: {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.block, style]}>
      {title ? (
        <T weight={800} size={16} ls={-0.4} style={{ marginBottom: 7 }}>
          {title}
        </T>
      ) : null}
      {children}
    </View>
  );
}

export function MenuRow({
  icon,
  title,
  sub,
  onPress,
  danger,
  testID,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} testID={testID}>
      <View style={styles.menuIco}>
        <Icon name={icon} size={17} color={danger ? colors.red : colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T weight={800} size={14} color={danger ? colors.red : colors.ink}>
          {title}
        </T>
        {sub ? (
          <T weight={500} size={11.5} color={colors.muted} style={{ marginTop: 2 }}>
            {sub}
          </T>
        ) : null}
      </View>
      <Icon name="chev" size={16} color={colors.faint} />
    </Pressable>
  );
}

export function Switch({
  value,
  onChange,
  testID,
}: {
  value: boolean;
  onChange: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onChange}
      style={[styles.switch, { backgroundColor: value ? colors.black : colors.soft2 }]}
    >
      <View
        style={[
          styles.knob,
          { alignSelf: value ? "flex-end" : "flex-start" },
        ]}
      />
    </Pressable>
  );
}

export function ToggleRow({
  title,
  sub,
  value,
  onChange,
  testID,
}: {
  title: string;
  sub?: string;
  value: boolean;
  onChange: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <T weight={800} size={14}>
          {title}
        </T>
        {sub ? (
          <T weight={500} size={11.5} color={colors.muted} style={{ marginTop: 3 }}>
            {sub}
          </T>
        ) : null}
      </View>
      <Switch value={value} onChange={onChange} testID={testID} />
    </View>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <T weight={800} size={16} style={{ marginBottom: 5 }}>
        {title}
      </T>
      <T weight={500} size={12.5} color={colors.muted} style={{ textAlign: "center", lineHeight: 18 }}>
        {body}
      </T>
    </View>
  );
}

export function TrustTag({ label }: { label: string }) {
  return (
    <View style={styles.trustTag}>
      <T weight={900} size={10} color={colors.white}>
        {label}
      </T>
    </View>
  );
}

// The PROPERTY's own verification state, written on every listing as
// `verificationStatus` and, until now, rendered on no screen at all.
//
// Deliberately shaped NOTHING like TrustTag. TrustTag is a solid black pill
// and describes the SELLER; this is an outlined pill with a coloured dot and
// describes the LISTING, so the two never read as the same claim when they
// sit near each other on /detail.
//
// Three states, distinguishable by dot colour, border colour and wording —
// not by colour alone:
//   verified -> green   "Verified property"
//   pending  -> ink     "Verification pending"
//   rejected -> red     "Verification rejected"
// Anything else (including a missing field on the seeded rows) renders
// nothing rather than guessing.
export function ListingStatusTag({
  status,
  compact = false,
}: {
  status?: string;
  compact?: boolean;
}) {
  const map: Record<string, { label: string; short: string; color: string }> = {
    verified: { label: "Verified property", short: "Verified", color: colors.green },
    pending: { label: "Verification pending", short: "Pending", color: colors.ink },
    rejected: { label: "Verification rejected", short: "Rejected", color: colors.red },
  };
  const s = status ? map[status] : undefined;
  if (!s) return null;
  return (
    <View
      testID={`listing-status-${status}`}
      style={[
        styles.statusTag,
        { borderColor: s.color },
        compact && { height: 20, paddingHorizontal: 7, gap: 4 },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
      <T weight={900} size={compact ? 8.5 : 10} color={s.color}>
        {compact ? s.short : s.label}
      </T>
    </View>
  );
}

// Whether the property is still available. A DIFFERENT CLAIM from
// ListingStatusTag, which is about whether AASTHI checked the documents — a
// property can be Verified and Sold at once, so the two must never be
// mistaken for each other and are drawn differently on purpose:
//   ListingStatusTag = white pill, coloured border, coloured dot
//   SaleStatusTag    = SOLID filled pill, white text
// "live" renders nothing: the absence of a badge is what "still available"
// looks like, and a "Live" pill on every card would be noise.
export function SaleStatusTag({
  status,
  compact = false,
}: {
  status?: string;
  compact?: boolean;
}) {
  const map: Record<string, { label: string; bg: string }> = {
    token: { label: "Token paid", bg: "#4a4a4d" },
    sold: { label: "Sold", bg: colors.black },
  };
  const s = status ? map[status] : undefined;
  if (!s) return null;
  return (
    <View
      testID={`sale-status-${status}`}
      style={[
        styles.saleTag,
        { backgroundColor: s.bg },
        compact && { height: 20, paddingHorizontal: 8 },
      ]}
    >
      <T weight={900} size={compact ? 8.5 : 10} color={colors.white}>
        {s.label}
      </T>
    </View>
  );
}

export function ToastHost() {
  const { toast } = useApp();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: toast ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [toast, anim]);
  if (!toast) return null;
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          pointerEvents: "none",
          bottom: NAV_HEIGHT + insets.bottom + 18,
          opacity: anim,          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <T weight={700} size={12.5} color={colors.white} style={{ textAlign: "center" }}>
        {toast}
      </T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pageHead: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.055)",
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  btn: {
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    borderRadius: radius.field,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  fieldInput: {
    fontFamily: font.extrabold,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  textarea: {
    borderRadius: radius.field,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    minHeight: 104,
    padding: 13,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 3,
  },
  chip: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipOn: { backgroundColor: colors.black, borderColor: colors.black },
  chipDark: {
    backgroundColor: "rgba(255,255,255,0.11)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipDarkOn: { backgroundColor: colors.white, borderColor: colors.white },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 22,
    marginBottom: 11,
  },
  block: {
    borderRadius: radius.block,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginVertical: 6,
    ...shadow.soft,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 11,
    marginBottom: 8,
    ...shadow.soft,
  },
  menuIco: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    padding: 3,
    justifyContent: "center",
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 11,
    marginBottom: 8,
    ...shadow.soft,
  },
  empty: {
    borderRadius: radius.card,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.14)",
    borderStyle: "dashed",
    paddingVertical: 22,
    paddingHorizontal: 15,
    alignItems: "center",
    marginTop: 14,
  },
  trustTag: {
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTag: {
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  saleTag: {
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  toast: {
    position: "absolute",
    left: 40,
    right: 40,
    backgroundColor: "rgba(14,14,14,0.94)",
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 14,
    zIndex: 200,
  },
});
