import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PageHead, Screen, Textarea } from "@/src/components/ui";
import { useApp } from "@/src/store/AppContext";

export default function Enquiry() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, sellerOf, addLead, showToast } = useApp();
  const listing = listings.find((l) => l.id === id) ?? listings[0];

  const [subject, setSubject] = useState("I am interested in this property");
  const [msg, setMsg] = useState("Please share more details and available visit timings.");

  const [sending, setSending] = useState(false);

  // Only confirm what actually happened. This used to fire addLead and
  // navigate straight to "Enquiry Sent" without waiting, so a write that
  // failed still told the buyer the seller had their message.
  const onSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await addLead(listing.id, sellerOf(listing).id, "enquiry", `${subject.trim()}: ${msg.trim()}`);
      showToast("Enquiry sent to seller");
      router.replace(`/request-sent?type=enquiry&id=${listing.id}`);
    } catch {
      showToast("Could not send your enquiry. Check your connection and try again.");
      setSending(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Enquiry" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={subject} onChangeText={setSubject} testID="enquiry-subject" />
        <Textarea value={msg} onChangeText={setMsg} testID="enquiry-message" />
        <Button label={sending ? "Sending…" : "Send enquiry"} onPress={onSend} testID="enquiry-send" />
      </View>
    </Screen>
  );
}
