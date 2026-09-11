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
  const [sent, setSent] = useState(false);

  // NO CONFIRMATION PAGE. Sending now shows a toast and leaves the user
  // exactly where they are — /request-sent is no longer pushed from here.
  //
  // Still only confirms what actually happened: addLead is awaited, so a
  // failed write shows the failure instead of "Inquiry sent". And the button
  // latches to a sent state afterwards, because staying on the form makes it
  // easy to tap Send twice and create two identical leads.
  const onSend = async () => {
    if (sending || sent) return;
    // Null means this listing has no seller anything can reach: no sellerUid,
    // and its numeric seller matches nobody. Sending would write a lead into a
    // collection no account can read and then say "Inquiry sent".
    const seller = sellerOf(listing);
    if (!seller) {
      showToast("This listing has no seller on record. Nothing was sent.");
      return;
    }
    setSending(true);
    try {
      await addLead(listing.id, seller.id, "enquiry", `${subject.trim()}: ${msg.trim()}`);
      showToast("Inquiry sent");
      setSent(true);
    } catch {
      showToast("Could not send your inquiry. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Inquiry" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={subject} onChangeText={setSubject} testID="enquiry-subject" />
        <Textarea value={msg} onChangeText={setMsg} testID="enquiry-message" />
        <Button
          label={sent ? "Inquiry sent" : sending ? "Sending…" : "Send inquiry"}
          onPress={onSend}
          variant={sent ? "light" : "black"}
          testID="enquiry-send"
        />
      </View>
    </Screen>
  );
}
