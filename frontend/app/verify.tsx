import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Block, Button, PageHead, Screen, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { auth } from "@/src/services/firebase";
import { submitVerification, uploadImages, watchMyVerification } from "@/src/services/db";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const STATUS_COPY: Record<string, { title: string; body: string; color: string }> = {
  pending: { title: "Verification under review", body: "Our team is reviewing your documents. This usually takes up to 24 hours.", color: colors.gold },
  approved: { title: "You're verified", body: "Your account now shows the Verified badge across your listings.", color: colors.green },
  rejected: { title: "Verification rejected", body: "Your documents couldn't be verified. Please re-submit clear, valid documents.", color: colors.red },
};

export default function Verify() {
  const router = useRouter();
  const { user, showToast } = useApp();
  const uid = auth.currentUser?.uid;
  const [status, setStatus] = useState<string | null>(null);
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [ownDoc, setOwnDoc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsub = watchMyVerification(uid, setStatus);
    return unsub;
  }, [uid]);

  const pick = async (setter: (u: string) => void) => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain) perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast("Photo access needed. Open Settings to allow.");
        setTimeout(() => Linking.openSettings(), 600);
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!res.canceled && res.assets?.[0]) setter(res.assets[0].uri);
  };

  const submit = async () => {
    if (!uid) return;
    if (!idDoc || !ownDoc) {
      showToast("Upload both documents to continue");
      return;
    }
    setBusy(true);
    showToast("Submitting for verification…");
    try {
      const urls = await uploadImages([idDoc, ownDoc], `verifications/${uid}`);
      await submitVerification({
        sellerUid: uid,
        sellerName: user.name || "Seller",
        idDocUrl: urls[0],
        ownershipDocUrl: urls[1],
      });
      showToast("Submitted for verification");
      setIdDoc(null);
      setOwnDoc(null);
    } catch {
      showToast("Could not submit — please try again");
    }
    setBusy(false);
  };

  const active = status === "pending" || status === "approved";

  return (
    <Screen header={<PageHead title="Get Verified" onBack={() => router.back()} />}>
      {status && STATUS_COPY[status] ? (
        <View style={[styles.status, { borderColor: STATUS_COPY[status].color }]}>
          <T weight={800} size={17} color={STATUS_COPY[status].color}>
            {STATUS_COPY[status].title}
          </T>
          <T weight={500} size={13.5} color={colors.muted} style={{ marginTop: 8, lineHeight: 20 }}>
            {STATUS_COPY[status].body}
          </T>
        </View>
      ) : null}

      {!active ? (
        <>
          <Block title="Build buyer trust" style={{ marginTop: 12 }}>
            <T weight={500} size={14} color="#5f5f5f" style={{ lineHeight: 21 }}>
              Verified sellers get a badge and higher visibility. Upload a Govt ID and property ownership proof — our team reviews them privately.
            </T>
          </Block>

          <T weight={900} size={11} color={colors.faint} ls={0.6} style={{ marginTop: 20, marginBottom: 10, textTransform: "uppercase" }}>
            Documents
          </T>
          <View style={{ gap: 10 }}>
            <DocTile label="Government ID" hint="Aadhaar, PAN or Driving Licence" uri={idDoc} onPick={() => pick(setIdDoc)} testID="verify-id" />
            <DocTile label="Ownership proof" hint="Sale deed, tax receipt or EC" uri={ownDoc} onPick={() => pick(setOwnDoc)} testID="verify-own" />
          </View>
          <Button label={busy ? "Submitting…" : "Submit for verification"} onPress={submit} style={{ marginTop: 16 }} testID="verify-submit" />
        </>
      ) : null}
    </Screen>
  );
}

function DocTile({ label, hint, uri, onPick, testID }: { label: string; hint: string; uri: string | null; onPick: () => void; testID: string }) {
  return (
    <Pressable style={styles.tile} onPress={onPick} testID={testID}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbEmpty}>
          <Icon name="camera" size={20} color={colors.muted} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <T weight={700} size={15}>
          {label}
        </T>
        <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }}>
          {uri ? "Tap to change" : hint}
        </T>
      </View>
      <Icon name={uri ? "check" : "plus"} size={18} color={uri ? colors.green : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  status: { borderRadius: 22, borderWidth: 1.5, backgroundColor: "#fbfbfa", padding: 16, marginTop: 14 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  thumbEmpty: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
});
