import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

// Shared confirmation for enquiry / visit / contact.
//
// This screen deliberately has NO side effects. The lead is written by the
// action that produced it (enquiry.tsx, visit.tsx, contact.tsx) and this only
// renders the result. Enquiry and visit used to land on /contact, whose mount
// effect writes a "contact" lead, so every enquiry and every visit silently
// produced a second, wrongly-typed lead and notification — and confirmed with
// "Contact Request Sent" regardless of what the user actually did.

type RequestType = "enquiry" | "visit" | "contact";

const COPY: Record<RequestType, { header: string; title: string; body: string }> = {
  enquiry: {
    header: "Inquiry",
    title: "Inquiry Sent",
    body: "The seller has your message and will respond shortly.",
  },
  visit: {
    header: "Schedule Visit",
    title: "Visit Requested",
    body: "The seller will confirm your time slot shortly.",
  },
  contact: {
    header: "Contact Seller",
    title: "Contact Request Sent",
    body: "Seller contact details will be shared after an inquiry.",
  },
};

export default function RequestSent() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { listings } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];
  const copy = COPY[(type as RequestType) in COPY ? (type as RequestType) : "contact"];

  return (
    <Screen header={<PageHead title={copy.header} onBack={() => router.back()} />} footer={undefined}>
      <Empty title={copy.title} body={copy.body} />
      <Button
        label="Back to listing"
        variant="light"
        onPress={() => router.replace(`/detail?id=${listing?.id ?? ""}`)}
        style={{ marginTop: 16 }}
        testID="request-sent-back-listing"
      />
    </Screen>
  );
}
