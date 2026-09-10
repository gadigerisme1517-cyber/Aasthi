import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Empty, PageHead, Screen, SectionHead, T } from "@/src/components/ui";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// The seller's side of a lead. Before this screen existed, a lead was written
// to a collection that no client and no server code ever read, and the only
// notification produced was addressed to the buyer — so an enquiry reached
// nobody. See firebase/firestore.rules (leads) for the read rule that makes
// this query legal.

const TYPE_LABEL: Record<string, string> = {
  enquiry: "Enquiry",
  visit: "Visit request",
  contact: "Contact request",
};

function whenText(ts: any): string {
  const seconds = ts?.seconds;
  if (!seconds) return "Just now";
  const then = seconds * 1000;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(then).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyEnquiries() {
  const router = useRouter();
  const { myLeads, listings } = useApp();

  return (
    <Screen header={<PageHead title="My enquiries" onBack={() => router.back()} />}>
      <SectionHead
        title="Enquiries on your listings"
        sub="Buyers who contacted you, newest first."
      />

      {myLeads.length ? (
        <View style={{ gap: 12 }}>
          {myLeads.map((lead: any) => {
            const listing = listings.find((l) => l.id === lead.listingId);
            const title = lead.listingTitle || listing?.title || "A listing";
            const label = TYPE_LABEL[lead.type] ?? "Enquiry";
            return (
              <Pressable
                key={lead.id}
                style={styles.row}
                testID={`enquiry-${lead.id}`}
                onPress={() =>
                  listing ? router.push(`/detail?id=${listing.id}`) : undefined
                }
              >
                <View style={styles.top}>
                  <View style={styles.typePill}>
                    <T weight={900} size={9.5} color={colors.white}>
                      {label}
                    </T>
                  </View>
                  <T weight={700} size={10.5} color={colors.faint}>
                    {whenText(lead.ts)}
                  </T>
                </View>

                <T weight={800} size={15} style={{ marginTop: 10 }} numberOfLines={1}>
                  {lead.buyerName?.trim() || "AASTHI buyer"}
                </T>

                <T
                  weight={500}
                  size={12}
                  color={colors.muted}
                  style={{ marginTop: 3 }}
                  numberOfLines={1}
                >
                  About: {title}
                </T>

                {lead.message?.trim() ? (
                  <View style={styles.quote}>
                    <T weight={500} size={13.5} color="#383838" style={{ lineHeight: 20 }}>
                      {lead.message.trim()}
                    </T>
                  </View>
                ) : (
                  <T
                    weight={500}
                    size={12.5}
                    color={colors.faint}
                    style={{ marginTop: 10 }}
                  >
                    No message — the buyer asked for your contact details.
                  </T>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Empty
          title="No enquiries yet"
          body="When a buyer messages, requests your number or asks to visit one of your listings, it appears here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    ...shadow.soft,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typePill: {
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.black,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quote: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: colors.soft,
    padding: 12,
  },
});
