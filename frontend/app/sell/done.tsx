import { useRouter } from "expo-router";

import { Button, Empty, PageHead, Screen } from "@/src/components/ui";

export default function PublishDone() {
  const router = useRouter();
  return (
    <Screen header={<PageHead title="Published" onBack={() => router.replace("/(tabs)")} />}>
      <Empty title="Listing is Live" body="Your property is now visible on AASTHI." />
      <Button label="Promote Listing" onPress={() => router.push("/sell/boost")} style={{ marginTop: 16 }} testID="done-promote" />
      <Button label="Back to Home" variant="light" onPress={() => router.replace("/(tabs)")} style={{ marginTop: 10 }} testID="done-home" />
    </Screen>
  );
}
