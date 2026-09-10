import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Block, Button, Field, MenuRow, PageHead, Screen, T } from "@/src/components/ui";
import { auth } from "@/src/services/firebase";
import { uploadImages } from "@/src/services/db";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";


export default function Account() {
  const router = useRouter();
  const { user, updateAccount, showToast } = useApp();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [city, setCity] = useState(user.city);
  const [avatar, setAvatar] = useState(user.avatar);
  // The shop's banner. Edited from here so there is one place that owns
  // profile imagery, reached from the Edit control on the shop cover.
  const [cover, setCover] = useState(user.cover ?? "");
  const [busy, setBusy] = useState(false);

  const pickInto = async (setter: (uri: string) => void) => {
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

  const changePhoto = async () => {
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
    if (!res.canceled && res.assets?.[0]) setAvatar(res.assets[0].uri);
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let avatarUrl = avatar;
      let coverUrl = cover;
      const uid = auth.currentUser?.uid;
      if (uid && avatar && !avatar.startsWith("http")) {
        const [uploaded] = await uploadImages([avatar], `listings/${uid}`);
        if (uploaded) avatarUrl = uploaded;
      }
      if (uid && cover && !cover.startsWith("http")) {
        const [uploaded] = await uploadImages([cover], `listings/${uid}`);
        if (uploaded) coverUrl = uploaded;
      }
      await updateAccount({
        name: name.trim() || user.name,
        phone,
        email,
        city,
        avatar: avatarUrl,
        ...(coverUrl ? { cover: coverUrl } : {}),
      });
      showToast("Profile updated");
      router.back();
    } catch {
      showToast("Could not save changes. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Account" onBack={() => router.back()} />}>
      <Block style={{ marginTop: 18, alignItems: "center" }}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Pressable onPress={changePhoto} testID="account-change-photo" style={{ marginTop: 12 }}>
          <T weight={800} size={13} color={colors.ink}>
            Change photo
          </T>
        </Pressable>
      </Block>

      <Block title="Shop cover" style={{ marginTop: 12 }}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverEmpty]}>
            <T weight={600} size={12} color={colors.muted}>
              No cover yet — your first listing's photo is used instead
            </T>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <Pressable onPress={() => pickInto(setCover)} testID="account-change-cover">
            <T weight={800} size={13} color={colors.ink}>
              {cover ? "Change cover" : "Add a cover"}
            </T>
          </Pressable>
          {cover ? (
            <Pressable onPress={() => setCover("")} testID="account-clear-cover">
              <T weight={800} size={13} color={colors.red}>
                Remove
              </T>
            </Pressable>
          ) : null}
        </View>
      </Block>

      <View style={{ gap: 12, marginTop: 4 }}>
        <Field value={name} onChangeText={setName} placeholder="Full name" testID="account-name" />
        <Field value={phone} onChangeText={setPhone} placeholder="Phone number" testID="account-phone" />
        <Field value={email} onChangeText={setEmail} placeholder="Email address" testID="account-email" />
        <Field value={city} onChangeText={setCity} placeholder="City" testID="account-city" />
        <Button label={busy ? "Saving…" : "Save changes"} onPress={save} testID="account-save" />
      </View>

      <View style={{ marginTop: 16 }}>
        <MenuRow icon="shield" title="Change password" sub="Update your login password" onPress={() => router.push("/change-password")} testID="account-change-password" />
      </View>

      <View style={styles.danger}>
        <T weight={700} size={17} color={colors.red}>
          Delete account
        </T>
        <T weight={500} size={13} color={colors.muted} style={{ marginVertical: 10, lineHeight: 19 }}>
          This permanently removes your listings, saved properties and profile from AASTHI.
        </T>
        <Button label="Delete my account" variant="red" onPress={() => router.push("/delete-confirm")} testID="account-delete" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 92, height: 92, borderRadius: 46 },
  cover: { width: "100%", height: 120, borderRadius: 18, backgroundColor: colors.soft },
  coverEmpty: { alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  danger: {
    marginTop: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.2)",
    backgroundColor: "rgba(180,18,24,0.04)",
    padding: 18,
  },
});
