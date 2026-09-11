import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FeatureCard } from "@/src/components/cards";
import { Button, PageHead, Screen, T } from "@/src/components/ui";
import { Listing, Seller, USER_SELLER_ID } from "@/src/data/seed";
import { colors } from "@/src/theme";
import { listingTypeOf, useApp } from "@/src/store/AppContext";

export default function Preview() {
  const router = useRouter();
  const { draft, user, publishListing, showToast } = useApp();
  const [publishing, setPublishing] = useState(false);
  const [failedLabels, setFailedLabels] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const filled = draft.photos.filter(Boolean) as string[];
  // Shared with publishListing so the preview and the saved document can no
  // longer disagree about the type.
  const previewType: Listing["type"] = listingTypeOf(draft.category, draft.propertyType);
  const preview: Listing = {
    id: "preview",
    type: previewType,
    price: draft.price,
    title: draft.title,
    addr: draft.addr,
    beds: draft.beds,
    baths: draft.baths,
    area: draft.area,
    facing: draft.facing,
    dist: "1.0 km",
    seller: USER_SELLER_ID,
    img: filled[0] || draft.img,
    g: filled.length ? filled : draft.g,
    desc: draft.desc,
  };

  // The agent strip used to show sellers[0] — the seeded company "Sri Homes
  // Realty" — on every user's own preview. It shows the actual publisher now.
  const previewSeller: Seller = {
    id: USER_SELLER_ID,
    name: user.name || "AASTHI member",
    meta: user.city || "Private seller",
    trust: "Private seller",
    verified: Boolean(user.verified),
    img: user.avatar,
    cover: preview.img,
    phone: user.phone,
  };

  const onPublish = async () => {
    if (publishing) return;
    if (!filled.length) {
      showToast("Add at least one real photo before publishing");
      router.push("/sell/photos");
      return;
    }
    // A listing with no reachable seller is the reason "Contact number" never
    // delivered anything. Checked here as well as in publishListing so the
    // user is sent somewhere useful rather than just refused.
    if (!user.phone.trim()) {
      showToast("Add your phone number so buyers can reach you");
      router.push("/account");
      return;
    }
    setPublishing(true);
    setFailedLabels([]);
    showToast("Publishing listing…");
    try {
      await publishListing();
      showToast("Listing published");
      router.replace("/sell/done");
    } catch (e: any) {
      if (e?.code === "no-phone") {
        showToast("Add your phone number so buyers can reach you");
        router.push("/account");
      } else if (e?.code === "upload-failed") {
        // The publish was REFUSED. Nothing was written. Photos that did
        // upload are held on the draft, so "Retry upload" only re-sends the
        // ones named below and the rest of the draft is untouched.
        setFailedLabels(e.failedLabels ?? []);
        setUploadedCount(e.uploadedCount ?? 0);
        setTotalCount(e.totalCount ?? 0);
        showToast("Listing not published — some photos did not upload");
      } else if (e?.code === "no-photos") {
        showToast("Add at least one real photo before publishing");
        router.push("/sell/photos");
      } else {
        showToast("Could not publish — please try again");
      }
      setPublishing(false);
    }
  };

  return (
    <Screen header={<PageHead title="Preview" onBack={() => router.back()} />}>
      <FeatureCard listing={preview} preview />
      {/* The browse card no longer carries a seller strip, so the publisher
          is named here instead. Without it the seller could not see who the
          listing will be attributed to before publishing — which is the whole
          reason that strip mattered on this screen. */}
      <View style={styles.attribution}>
        <T weight={800} size={11} color={colors.faint} ls={0.6} style={{ textTransform: "uppercase" }}>
          Will be published as
        </T>
        <T weight={700} size={15} style={{ marginTop: 4 }} numberOfLines={1}>
          {previewSeller.name}
        </T>
        <T weight={500} size={12.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {previewSeller.meta}
          {user.phone.trim() ? ` · ${user.phone.trim()}` : ""}
        </T>
      </View>
      {!user.phone.trim() ? (
        <View style={styles.warn} testID="preview-no-phone">
          <T weight={800} size={13} color={colors.red}>
            Add a phone number first
          </T>
          <T weight={500} size={12.5} color={colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
            Buyers ask for your number from the listing. Publishing is blocked
            until your account has one.
          </T>
        </View>
      ) : null}
      {failedLabels.length ? (
        <View style={styles.warn} testID="preview-upload-failed">
          <T weight={800} size={13} color={colors.red}>
            {failedLabels.length === 1
              ? "1 photo did not upload"
              : `${failedLabels.length} photos did not upload`}
          </T>
          <T weight={500} size={12.5} color={colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
            Nothing was published. {uploadedCount} of {totalCount} photos are
            saved and will not be sent again.
          </T>
          <View style={{ marginTop: 8, gap: 4 }}>
            {failedLabels.map((label) => (
              <T key={label} weight={800} size={12.5} color={colors.ink}>
                • {label}
              </T>
            ))}
          </View>
          <T weight={500} size={12} color={colors.muted} style={{ marginTop: 8, lineHeight: 17 }}>
            Retry to send just these, or go back to Photos to replace them.
          </T>
          <Button
            label={publishing ? "Retrying…" : "Retry upload and publish"}
            onPress={onPublish}
            style={{ marginTop: 12 }}
            testID="preview-retry-upload"
          />
          <Button
            label="Back to Photos"
            variant="light"
            onPress={() => router.push("/sell/photos")}
            style={{ marginTop: 8 }}
            testID="preview-back-photos"
          />
        </View>
      ) : null}

      <Button
        label={publishing ? "Publishing…" : "Publish Listing"}
        onPress={onPublish}
        testID="preview-publish"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  attribution: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    marginBottom: 12,
  },
  warn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.2)",
    backgroundColor: "rgba(180,18,24,0.04)",
    padding: 14,
    marginBottom: 12,
  },
});
