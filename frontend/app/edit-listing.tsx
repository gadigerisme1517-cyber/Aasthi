import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  Empty,
  Field,
  ListingStatusTag,
  PageHead,
  Screen,
  SectionLabel,
  T,
  Textarea,
  ToggleRow,
} from "@/src/components/ui";
import { SelectChips } from "@/src/components/choice";
import { SALE_STATUS_LABEL, type SaleStatus } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { auth } from "@/src/services/firebase";
import { uploadImages } from "@/src/services/db";
import { colors, radius } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// Edit and delete for a listing the signed-in user owns.
// firestore.rules:27 already allowed owner update/delete; nothing in the app
// ever called it.

export default function EditListing() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myListings, updateMyListing, deleteMyListing, showToast } = useApp();
  const listing = myListings.find((l) => l.id === id);

  const [title, setTitle] = useState(listing?.title ?? "");
  const [price, setPrice] = useState(listing?.price ?? "");
  const [area, setArea] = useState(listing?.area ?? "");
  const [beds, setBeds] = useState(listing?.beds === "-" ? "" : (listing?.beds ?? ""));
  const [baths, setBaths] = useState(listing?.baths === "-" ? "" : (listing?.baths ?? ""));
  const [desc, setDesc] = useState(listing?.desc ?? "");
  // Same two optional answers as the publish form. Blank means unanswered and
  // stays unanswered; the facts column shows "–" rather than a fabricated 0.
  const [floor, setFloor] = useState(
    typeof (listing as any)?.floor === "number" ? String((listing as any).floor) : "",
  );
  const [corner, setCorner] = useState<string>(
    typeof (listing as any)?.corner === "boolean" ? ((listing as any).corner ? "yes" : "no") : "",
  );
  const [photos, setPhotos] = useState<string[]>(
    listing ? ([listing.img, ...(listing.g ?? [])].filter(Boolean) as string[]) : [],
  );
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReverify, setConfirmingReverify] = useState(false);
  // Sale status is NOT part of materialChanged below, on purpose: marking a
  // property sold says nothing about whether its documents were checked, so
  // it must never send an approved listing back for re-verification.
  const [saleStatus, setSaleStatus] = useState<SaleStatus>(
    ((listing as any)?.saleStatus as SaleStatus) ?? "live",
  );
  // Visibility used to live ONLY on the owner bar under the card in the
  // storefront. That bar is gone — three text buttons do not fit in a
  // half-width tile panel — so the control moved here, where the rest of a
  // listing's settings already are. It is not a new capability and it is not
  // a lost one.
  const [visible, setVisible] = useState<boolean>(!(listing as any)?.hidden);

  // The photo list as it was when this screen opened. Captured once so that
  // adding then removing the same photo does not count as a change.
  const originalPhotos = useRef<string>(
    JSON.stringify(listing ? [listing.img, ...(listing.g ?? [])].filter(Boolean) : []),
  );

  // WHICH EDITS COST A RE-REVIEW.
  // Price, area and photos are the three things a buyer relies on and the
  // three an approved seller could quietly swap after approval, so changing
  // any of them sends the listing back to "pending". Title, description,
  // beds and baths do not — they are descriptive and re-reviewing them would
  // punish sellers for fixing a typo.
  const materialChanged =
    !!listing &&
    (price.trim() !== (listing.price ?? "").trim() ||
      area.trim() !== (listing.area ?? "").trim() ||
      JSON.stringify(photos) !== originalPhotos.current);

  // Only a listing that HAS been verified can lose it. A listing that is
  // already pending stays pending; one that was never reviewed is unaffected.
  const needsReverify =
    materialChanged && (listing as any)?.verificationStatus === "verified";

  const changedFields = listing
    ? [
        price.trim() !== (listing.price ?? "").trim() ? "price" : null,
        area.trim() !== (listing.area ?? "").trim() ? "area" : null,
        JSON.stringify(photos) !== originalPhotos.current ? "photos" : null,
      ].filter(Boolean)
    : [];

  if (!listing) {
    return (
      <Screen header={<PageHead title="Edit listing" onBack={() => router.back()} />}>
        <Empty
          title="Listing not found"
          body="This property may have been removed, or it is not one of yours."
        />
      </Screen>
    );
  }

  const addPhoto = async () => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain) perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      setPhotos((p) => [...p, res.assets[0].uri]);
    }
  };

  // Tapping Save when a re-review is due opens the confirmation instead of
  // writing, so the seller is told the cost before they pay it.
  const onSavePressed = () => {
    if (busy) return;
    if (!title.trim()) return showToast("Give your listing a title");
    if (!price.trim()) return showToast("Enter a price");
    if (!area.trim()) return showToast("Enter the area");
    if (!desc.trim()) return showToast("Add a short description");
    if (!photos.length) return showToast("Keep at least one photo");
    if (needsReverify && !confirmingReverify) {
      setConfirmingReverify(true);
      return;
    }
    save();
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Anything not already an https URL is a freshly picked local file and
      // needs uploading before it can be written to the document.
      const uid = auth.currentUser?.uid;
      const local = photos.filter((p) => !p.startsWith("http"));
      let uploaded: string[] = [];
      if (local.length && uid) {
        uploaded = await uploadImages(local, `listings/${uid}`);
      }
      let next = 0;
      const finalPhotos = photos.map((p) =>
        p.startsWith("http") ? p : (uploaded[next++] ?? p),
      );

      await updateMyListing(listing.id, {
        title: title.trim(),
        price: price.trim(),
        area: area.trim(),
        beds: beds.trim() || "-",
        baths: baths.trim() || "-",
        desc: desc.trim(),
        // `g` is everything AFTER the cover — see publishListing. Writing the
        // full array here duplicated the cover in the gallery and inflated
        // the photo count.
        img: finalPhotos[0],
        g: finalPhotos.slice(1),
        saleStatus,
        hidden: !visible,
        ...(floor.trim() !== "" && Number.isFinite(Number(floor))
          ? { floor: Number(floor) }
          : {}),
        ...(corner === "yes" || corner === "no" ? { corner: corner === "yes" } : {}),
        // Only written when a re-review is actually due, so a description
        // fix never touches an approved listing's status.
        ...(needsReverify ? { verificationStatus: "pending" } : {}),
      });
      showToast(needsReverify ? "Saved — sent for re-verification" : "Listing updated");
      router.back();
    } catch {
      showToast("Could not save changes. Please try again.");
      setConfirmingReverify(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteMyListing(listing.id);
      showToast("Listing deleted");
      router.replace("/my-listings");
    } catch {
      showToast("Could not delete. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Edit listing" onBack={() => router.back()} />}>
      <View style={{ marginTop: 14, marginBottom: 4 }}>
        <ListingStatusTag status={(listing as any).verificationStatus} />
      </View>

      <SectionLabel>Sale status</SectionLabel>
      <SelectChips
        items={["live", "token", "sold"].map((s) => SALE_STATUS_LABEL[s as SaleStatus])}
        value={SALE_STATUS_LABEL[saleStatus]}
        onSelect={(label) => {
          const found = (["live", "token", "sold"] as SaleStatus[]).find(
            (s) => SALE_STATUS_LABEL[s] === label,
          );
          if (found) setSaleStatus(found);
        }}
        testIDPrefix="edit-sale"
      />
      <T weight={500} size={11.5} color={colors.faint} style={{ marginTop: 8, lineHeight: 16 }}>
        {saleStatus === "sold"
          ? "Sold properties leave Home and Search, and stay on your shop under Sold."
          : saleStatus === "token"
            ? "Token paid stays visible to buyers, marked so they know it is nearly gone."
            : "Live means still available and shown everywhere."}
      </T>

      <SectionLabel>Floor and corner</SectionLabel>
      <View style={{ gap: 12 }}>
        <Field
          value={floor}
          onChangeText={setFloor}
          placeholder="Floor (optional, 0 for ground)"
          keyboardType="number-pad"
          testID="edit-floor"
        />
        <SelectChips
          items={["Not stated", "Yes", "No"]}
          value={corner === "yes" ? "Yes" : corner === "no" ? "No" : "Not stated"}
          onSelect={(v) => setCorner(v === "Yes" ? "yes" : v === "No" ? "no" : "")}
          testIDPrefix="edit-corner"
        />
      </View>

      <SectionLabel>Visibility</SectionLabel>
      <ToggleRow
        title="Visible to buyers"
        sub={
          visible
            ? "Shown on Home, Search and your store."
            : "Hidden from buyers. Only you can see it, under the Hidden filter on your store."
        }
        value={visible}
        onChange={() => setVisible((v) => !v)}
        testID="edit-visible"
      />

      <SectionLabel>Details</SectionLabel>
      <View style={{ gap: 12 }}>
        <Field value={title} onChangeText={setTitle} placeholder="Listing title" testID="edit-title" />
        <Field value={price} onChangeText={setPrice} placeholder="Price" testID="edit-price" />
        <Field value={area} onChangeText={setArea} placeholder="Area" testID="edit-area" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field value={beds} onChangeText={setBeds} placeholder="Beds" keyboardType="number-pad" testID="edit-beds" />
          </View>
          <View style={{ flex: 1 }}>
            <Field value={baths} onChangeText={setBaths} placeholder="Baths" keyboardType="number-pad" testID="edit-baths" />
          </View>
        </View>
        <Textarea value={desc} onChangeText={setDesc} placeholder="Describe the property" testID="edit-desc" />
      </View>

      <SectionLabel>Photos</SectionLabel>
      <View style={styles.grid}>
        {photos.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.tile}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {i === 0 ? (
              <View style={styles.coverTag}>
                <T weight={700} size={8.5} color="#fff">
                  Cover
                </T>
              </View>
            ) : null}
            <Pressable
              style={styles.rm}
              onPress={() => setPhotos((p) => p.filter((_, x) => x !== i))}
              testID={`edit-photo-remove-${i}`}
            >
              <Icon name="close" size={13} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.tile} onPress={addPhoto} testID="edit-photo-add">
          <Icon name="camera" size={20} color={colors.muted} />
          <T weight={600} size={10} color={colors.muted} style={{ marginTop: 5 }}>
            Add photo
          </T>
        </Pressable>
      </View>
      <T weight={500} size={11.5} color={colors.faint} style={{ marginTop: 8, lineHeight: 16 }}>
        The first photo is the cover shown on cards and search results.
      </T>

      {/* Shown as soon as a material field changes — before Save is tapped —
          so the cost is never a surprise. */}
      {needsReverify && !confirmingReverify ? (
        <View style={styles.notice} testID="edit-reverify-notice">
          <T weight={700} size={12.5} color={colors.ink}>
            This will need re-verification
          </T>
          <T weight={500} size={12.5} color={colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
            You changed the {changedFields.join(" and ")}. Saving sends this
            listing back to pending until AASTHI reviews it again. It stays
            visible to buyers, carrying the pending tag.
          </T>
        </View>
      ) : null}

      {confirmingReverify ? (
        <View style={styles.notice} testID="edit-reverify-confirm">
          <T weight={700} size={13} color={colors.ink}>
            Save and lose the verified badge?
          </T>
          <T weight={500} size={12.5} color={colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
            Changing the {changedFields.join(" and ")} means this property has
            to be checked again. Its status goes back to pending until then.
          </T>
          <Button
            label={busy ? "Saving…" : "Save and re-verify"}
            onPress={save}
            style={{ marginTop: 12 }}
            testID="edit-reverify-confirm-save"
          />
          <Button
            label="Cancel"
            variant="light"
            onPress={() => setConfirmingReverify(false)}
            style={{ marginTop: 8 }}
            testID="edit-reverify-cancel"
          />
        </View>
      ) : (
        <Button
          label={busy ? "Saving…" : "Save changes"}
          onPress={onSavePressed}
          style={{ marginTop: 16 }}
          testID="edit-save"
        />
      )}

      <View style={styles.danger}>
        <T weight={700} size={16} color={colors.red}>
          Delete this listing
        </T>
        {confirmingDelete ? (
          <>
            <T weight={500} size={13} color={colors.muted} style={styles.dangerBody}>
              This removes the property from AASTHI permanently. Buyers will no
              longer see it, and inquiries already sent stay in My inquiries.
            </T>
            <Button
              label={busy ? "Deleting…" : "Yes, delete this listing"}
              variant="red"
              onPress={remove}
              testID="edit-delete-confirm"
            />
            <Button
              label="Cancel"
              variant="light"
              onPress={() => setConfirmingDelete(false)}
              style={{ marginTop: 8 }}
              testID="edit-delete-cancel"
            />
          </>
        ) : (
          <>
            <T weight={500} size={13} color={colors.muted} style={styles.dangerBody}>
              You will be asked to confirm before anything is removed.
            </T>
            <Button
              label="Delete listing"
              variant="red"
              onPress={() => setConfirmingDelete(true)}
              testID="edit-delete"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverTag: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rm: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  notice: {
    marginTop: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.soft,
    padding: 16,
  },
  danger: {
    marginTop: 20,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.2)",
    backgroundColor: "rgba(180,18,24,0.04)",
    padding: 18,
  },
  dangerBody: { marginVertical: 10, lineHeight: 19 },
});
