import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Contact() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast, iOwn } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const logged = useRef(false);
  // Entry guard. This screen writes its lead ON MOUNT, so the check has to
  // sit in the same effect rather than in the render — by the time a render
  // guard ran, the write would already have gone.
  const mine = iOwn(listing);
  const [state, setState] = useState<"sending" | "sent" | "failed" | "noseller" | "mine">(
    "sending",
  );

  // This screen writes its lead on mount, so it cannot ask the user to wait
  // before it renders. It reports the real outcome instead of always claiming
  // success — the header used to say "Contact Request Sent" even when the
  // write had failed.
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    // sellerOf is null when this listing has no owner anything can reach.
    // Writing the lead anyway would put a request into a collection nobody
    // can read and then tell the buyer their number is on its way.
    if (mine) {
      setState("mine");
      return;
    }
    const seller = sellerOf(listing);
    if (!seller) {
      setState("noseller");
      return;
    }
    addLead(listing.id, seller.id, "contact")
      .then(() => setState("sent"))
      .catch((e: any) => setState(e?.code === "own-listing" ? "mine" : "failed"));
  }, [listing, sellerOf, addLead, mine]);

  const retry = () => {
    const seller = sellerOf(listing);
    if (!seller) {
      setState("noseller");
      return;
    }
    setState("sending");
    addLead(listing.id, seller.id, "contact")
      .then(() => {
        setState("sent");
        showToast("Contact request sent");
      })
      .catch(() => setState("failed"));
  };

  const copy =
    state === "mine"
      ? {
          title: "This is your listing",
          body: "You cannot request the number on a property you published — it is your own. Open it from your store to edit it.",
        }
      : state === "noseller"
      ? {
          title: "No seller on this listing",
          body: "This listing has no seller account behind it, so a contact request would reach nobody. Nothing was sent.",
        }
      : state === "failed"
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
