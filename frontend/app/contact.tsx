import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Contact() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const logged = useRef(false);

  useEffect(() => {
    if (!logged.current) {
      logged.current = true;
      addLead(listing.id, sellerOf(listing).id, "contact");
    }
  }, [listing, sellerOf, addLead]);

  return (
    <Screen
      header={<PageHead title="Contact Seller" onBack={() => router.back()} />}
      footer={undefined}
    >
      <Empty
        title="Contact Request Sent"
        body="Seller contact details will be shared after enquiry."
      />
      <Button label="Back to listing" variant="light" onPress={() => router.replace(`/detail?id=${listing.id}`)} style={{ marginTop: 16 }} testID="contact-back-listing" />
    </Screen>
  );
}
