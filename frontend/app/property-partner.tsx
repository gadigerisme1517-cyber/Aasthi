import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { SelectChips } from "@/src/components/choice";
import { Block, Button, Field, PageHead, Screen, SectionLabel, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const TYPES = ["Agent", "Broker", "Builder", "Developer", "Consultant"];

export default function PropertyPartner() {
  const router = useRouter();
  const { user, updateAccount, showToast } = useApp();
  const [businessName, setBusinessName] = useState((user as any).businessName || "");
  const [partnerType, setPartnerType] = useState((user as any).partnerType || TYPES[0]);
  const [areas, setAreas] = useState((user as any).operatingAreas || user.city || "");
  const [office, setOffice] = useState("");
  const [rera, setRera] = useState("");

  const submit = () => {
    updateAccount({
      type: "Property Partner",
      partnerStatus: "pending",
      partnerType,
      businessName: businessName.trim() || user.name || "Property Partner",
      operatingAreas: areas.trim(),
      officeAddress: office.trim(),
      reraId: rera.trim(),
    } as any).then(() => {
      showToast("Property Partner request saved");
      router.back();
    });
  };

  return (
    <Screen keyboard header={<PageHead title="Property Partner" onBack={() => router.back()} />}>
      <Block style={{ marginTop: 14 }}>
        <T weight={900} size={22} ls={-0.8}>Sell professionally on AASTHI</T>
        <T weight={500} size={13} color={colors.muted} style={{ marginTop: 8, lineHeight: 20 }}>
          For agents, brokers, builders and developers who manage property sales as work.
        </T>
      </Block>

      <SectionLabel>Business details</SectionLabel>
      <View style={{ gap: 12 }}>
        <Field value={businessName} onChangeText={setBusinessName} placeholder="Business or display name" testID="partner-business" />
        <SelectChips items={TYPES} value={partnerType} onSelect={setPartnerType} testIDPrefix="partner-type" />
        <Field value={areas} onChangeText={setAreas} placeholder="Operating city / areas" testID="partner-areas" />
        <Field value={office} onChangeText={setOffice} placeholder="Office address (optional)" testID="partner-office" />
        <Field value={rera} onChangeText={setRera} placeholder="RERA ID (optional)" testID="partner-rera" />
      </View>

      <View style={styles.note}>
        <T weight={700} size={13}>What happens next?</T>
        <T weight={500} size={12} color={colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
          Your normal account still works. AASTHI can review partner details later before showing Verified Partner or Top Partner badges.
        </T>
      </View>

      <Button label="Submit request" onPress={submit} style={{ marginTop: 16 }} testID="partner-submit" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 16, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
});
