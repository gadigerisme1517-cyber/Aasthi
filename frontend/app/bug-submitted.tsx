import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";

export default function BugSubmitted() {
  const router = useRouter();
  const { ticket } = useLocalSearchParams<{ ticket: string }>();

  return (
    <Screen header={<PageHead title="Report sent" onBack={() => router.replace("/help")} />}>
      <Empty
        title="Thanks — we're on it"
        body={`Ticket ${ticket ?? "#AH-0000"} has been created. Our team usually responds within 24 hours.`}
      />
      <Button label="Done" onPress={() => router.replace("/help")} style={{ marginTop: 16 }} testID="bug-done" />
    </Screen>
  );
}
