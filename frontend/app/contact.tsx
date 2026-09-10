import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Contact() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const logged = useRef(false);
  const [state, setState] = useState<"sending" | "sent" | "failed">("sending");

  // This screen writes its lead on mount, so it cannot ask the user to wait
  // before it renders. It reports the real outcome instead of always claiming
  // success — the header used to say "Contact Request Sent" even when the
  // write had failed.
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    addLead(listing.id, sellerOf(listing).id, "contact")
      .then(() => setState("sent"))
      .catch(() => setState("failed"));
  }, [listing, sellerOf, addLead]);

  const retry = () => {
    setState("sending");
    addLead(listing.id, sellerOf(listing).id, "contact")
      .then(() => {
        setState("sent");
        showToast("Contact request sent");
      })
      .catch(() => setState("failed"));
  };

  const copy =
    state === "failed"
      ? {
          title: "Contact request not sent",
          body: "We could not reach AASTHI. Check your connection and try again — the seller has not been notified.",
        }
      : state === "sending"
        ? { title: "Sending your request…", body: "One moment." }
        : {
            title: "Contact Request Sent",
            body: "The seller's number appears on this listing now, and they have been notified.",
          };

  return (
    <Screen
      header={<PageHead title="Contact Seller" onBack={() => router.back()} />}
      footer={undefined}
    >
      <Empty title={copy.title} body={copy.body} />
      {state === "failed" ? (
        <Button label="Try again" onPress={retry} style={{ marginTop: 16 }} testID="contact-retry" />
      ) : null}
      <Button
        label="Back to listing"
        variant="light"
        onPress={() => router.replace(`/detail?id=${listing.id}`)}
        style={{ marginTop: state === "failed" ? 10 : 16 }}
        testID="contact-back-listing"
      />
    </Screen>
  );
}
