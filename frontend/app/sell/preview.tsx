import { useRouter } from "expo-router";
import { useState } from "react";

import { FeatureCard } from "@/src/components/cards";
import { Button, PageHead, Screen } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { useApp } from "@/src/store/AppContext";

export default function Preview() {
  const router = useRouter();
  const { draft, sellers, publishListing, showToast } = useApp();
  const [publishing, setPublishing] = useState(false);

  const filled = draft.photos.filter(Boolean) as string[];
  const previewType: Listing["type"] =
    draft.propertyType === "Open Plot"
      ? "Plots"
      : draft.propertyType === "Commercial"
        ? "Commercial"
        : draft.category.startsWith("Rent")
          ? "Rent"
          : "Buy";
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
    seller: 0,
    img: filled[0] || draft.img,
    g: filled.length ? filled : draft.g,
    desc: draft.desc,
  };

  const onPublish = async () => {
    if (publishing) return;
    if (!filled.length) {
      showToast("Add at least one real photo before publishing");
      router.push("/sell/photos");
      return;
    }
    setPublishing(true);
    showToast("Publishing listing…");
    try {
      await publishListing();
      showToast("Listing published");
      router.replace("/sell/done");
    } catch {
      showToast("Could not publish — please try again");
      setPublishing(false);
    }
  };

  return (
    <Screen header={<PageHead title="Preview" onBack={() => router.back()} />}>
      <FeatureCard listing={preview} seller={sellers[0] ?? ({} as any)} preview />
      <Button
        label={publishing ? "Publishing…" : "Publish Listing"}
        onPress={onPublish}
        testID="preview-publish"
      />
    </Screen>
  );
}
