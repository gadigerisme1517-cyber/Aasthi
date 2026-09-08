import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { MenuRow, PageHead, Screen, SectionLabel, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { colors, shadow } from "@/src/theme";

const FAQS = [
  { q: "How do I list a property?", a: "Tap List on the bottom bar, choose Sell or Rent, then follow the steps for details, photos and an optional 360° tour." },
  { q: "Is AASTHI free to use?", a: "Browsing and listing your first property is free. Promoted listings use paid boosts, shown clearly before you pay." },
  { q: "How are sellers verified?", a: "Sellers submit ID and property documents, which our team reviews before a Verified badge is shown on their listings." },
  { q: "Can I edit a listing after publishing?", a: "Yes, open the listing from your profile and update price, photos or details at any time." },
];

export default function Help() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Screen header={<PageHead title="Help & Support" onBack={() => router.back()} />}>
      <SectionLabel>Get in touch</SectionLabel>
      <MenuRow icon="message" title="Chat with support" sub="Typically replies within an hour" onPress={() => router.push("/support-chat")} testID="help-chat" />
      <MenuRow icon="bug" title="Report a bug" sub="Tell us what went wrong" onPress={() => router.push("/report-bug")} testID="help-bug" />

      <SectionLabel>Frequently asked</SectionLabel>
      <View style={{ gap: 10 }}>
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <View key={f.q} style={styles.faq}>
              <Pressable style={styles.faqQ} onPress={() => setOpen(isOpen ? null : i)} testID={`faq-${i}`}>
                <T weight={700} size={14.5} style={{ flex: 1, paddingRight: 12 }}>
                  {f.q}
                </T>
                <Icon name={isOpen ? "close" : "plus"} size={18} color={colors.ink} />
              </Pressable>
              {isOpen ? (
                <T weight={500} size={13.5} color={colors.muted} style={{ paddingHorizontal: 16, paddingBottom: 16, lineHeight: 20 }}>
                  {f.a}
                </T>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  faq: {
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadow.soft,
  },
  faqQ: { flexDirection: "row", alignItems: "center", padding: 16 },
});
