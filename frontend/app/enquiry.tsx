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

  const onSend = () => {
    addLead(listing.id, sellerOf(listing).id, "enquiry", `${subject.trim()}: ${msg.trim()}`);
    showToast("Enquiry sent to seller");
    router.replace(`/request-sent?type=enquiry&id=${listing.id}`);
  };

  return (
    <Screen keyboard header={<PageHead title="Enquiry" onBack={() => router.back()} />}>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Field value={subject} onChangeText={setSubject} testID="enquiry-subject" />
        <Textarea value={msg} onChangeText={setMsg} testID="enquiry-message" />
        <Button label="Send enquiry" onPress={onSend} testID="enquiry-send" />
      </View>
    </Screen>
  );
}
