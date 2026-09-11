import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ChoiceCard, ChoiceGrid } from "@/src/components/choice";
import { Button, PageHead, Screen, SectionLabel, T, Textarea } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

const TYPES = [
  { title: "App crash", sub: "App closes or freezes" },
  { title: "Wrong info", sub: "Incorrect listing details" },
  { title: "Payment issue", sub: "Boost or promotion problem" },
  { title: "Something else", sub: "Any other issue" },
];

export default function ReportBug() {
  const router = useRouter();
  const { submitBug, showToast } = useApp();
  const [type, setType] = useState(TYPES[0].title);
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  // Confirms in place, and KEEPS THE TICKET ON SCREEN. /bug-submitted was the
  // only place the ticket number ever appeared, so a toast on its own would
  // have thrown away the one piece of information the user needs to quote
  // back. The toast says it went; the line below says what it is called.
  const [ticket, setTicket] = useState<string | null>(null);

  const submit = async () => {
    if (sending || ticket) return;
    setSending(true);
    try {
      const id = await submitBug(type, desc);
      setTicket(id);
      showToast("Report sent");
    } catch {
      showToast("Could not send the report. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen keyboard header={<PageHead title="Report a bug" onBack={() => router.back()} />}>
      <SectionLabel>What type of issue?</SectionLabel>
      <ChoiceGrid>
        {TYPES.map((t) => (
          <ChoiceCard key={t.title} title={t.title} sub={t.sub} selected={type === t.title} onPress={() => setType(t.title)} testID={`bug-type-${t.title}`} />
        ))}
      </ChoiceGrid>
      <View style={{ marginTop: 16, gap: 12 }}>
        <Textarea value={desc} onChangeText={setDesc} placeholder="Describe what happened, and what you expected instead..." testID="bug-desc" />
        <Button
          label={ticket ? "Report sent" : sending ? "Sending…" : "Submit report"}
          variant={ticket ? "light" : undefined}
          onPress={submit}
          testID="bug-submit"
        />
        {ticket ? (
          <T weight={500} size={13} color={colors.muted} style={{ lineHeight: 19 }}>
            Your reference is {ticket}. Quote it if you contact support about this.
          </T>
        ) : null}
      </View>
    </Screen>
  );
}
