import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Block, PageHead, Screen, T } from "@/src/components/ui";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/src/data/seed";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

export default function SupportChat() {
  const router = useRouter();
  const { showToast } = useApp();

  const open = async (url: string, fallback: string) => {
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (ok) Linking.openURL(url);
    else showToast(fallback);
  };

  return (
    <Screen header={<PageHead title="Support" onBack={() => router.back()} />}>
      <Block title="We're here to help" style={{ marginTop: 16 }}>
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 20 }}>
          Reach the AASTHI team directly — pick whichever is easiest for you.
        </T>
      </Block>

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.light]} onPress={() => open(`tel:${SUPPORT_PHONE}`, "Calling AASTHI support…")} testID="support-call">
          <T weight={900} size={13}>
            Call us
          </T>
        </Pressable>
        <Pressable style={[styles.btn, styles.light]} onPress={() => open(`whatsapp://send?phone=${SUPPORT_WHATSAPP}`, "Opening WhatsApp…")} testID="support-whatsapp">
          <T weight={900} size={13}>
            WhatsApp
          </T>
        </Pressable>
        <Pressable style={[styles.btn, styles.black]} onPress={() => showToast("Message sent to support")} testID="support-message">
          <T weight={900} size={13} color="#fff">
            Send a message
          </T>
        </Pressable>
      </View>

      <Block title="Support hours">
        <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 20 }}>
          Monday to Saturday, 9:00 AM – 8:00 PM IST. Average first response time is under an hour.
        </T>
      </Block>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginVertical: 8 },
  btn: { flex: 1, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  light: { backgroundColor: colors.soft },
  black: { backgroundColor: colors.black },
});
