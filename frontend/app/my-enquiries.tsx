import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Empty, PageHead, Screen, SectionHead, T } from "@/src/components/ui";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// Both sides of a lead, on one screen.
//
// RECEIVED is the seller's view — enquiries on listings you own. SENT is the
// buyer's view, and it is why this screen can carry a nav slot at all: most
// users never publish anything, so a received-only screen would be a
// permanently empty tab for the majority.
//
// Both reads are permitted by the deployed rules, which allow a lead to be
// read by either party to it (firebase/firestore.rules, leads block).

type Side = "received" | "sent";

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
  const { myLeads, mySentLeads, listings, myListings } = useApp();

  // Open on the side that has something to show. A user who has never listed
  // anything is a buyer, and Received would be empty for them forever.
  const [side, setSide] = useState<Side>(myListings.length ? "received" : "sent");

  const rows = side === "received" ? myLeads : mySentLeads;

  return (
    <Screen header={<PageHead title="Enquiries" onBack={() => router.back()} />}>
      <View style={styles.switch}>
        {(["received", "sent"] as Side[]).map((s) => {
          const on = s === side;
          const count = s === "received" ? myLeads.length : mySentLeads.length;
          return (
            <Pressable
              key={s}
              style={[styles.switchBtn, on && styles.switchBtnOn]}
              onPress={() => setSide(s)}
              testID={`enquiries-tab-${s}`}
            >
              <T weight={900} size={12} color={on ? colors.white : colors.ink}>
                {s === "received" ? "Received" : "Sent"}
                {count ? ` (${count})` : ""}
              </T>
            </Pressable>
          );
        })}
      </View>

      <SectionHead
        title={side === "received" ? "Enquiries on your listings" : "Enquiries you sent"}
        sub={
          side === "received"
            ? "Buyers who contacted you, newest first."
            : "Properties you contacted, newest first."
        }
      />

      {rows.length ? (
        <View style={{ gap: 12 }}>
          {rows.map((lead: any) => {
            const listing = listings.find((l) => l.id === lead.listingId);
            // A lead outlives its listing on purpose. When the property is
            // gone the row still renders from the title stored on the lead,
            // and the row simply is not pressable — no navigation to a
            // listing that cannot be resolved, so no crash and no blank
            // screen.
            const gone = !listing;
            const title = lead.listingTitle || listing?.title || "A listing";
            const label = TYPE_LABEL[lead.type] ?? "Enquiry";
            const who =
              side === "received"
                ? lead.buyerName?.trim() || "AASTHI buyer"
                : lead.sellerName?.trim() || listing?.sellerName || "";

            return (
              <Pressable
                key={lead.id}
                style={[styles.row, gone && styles.rowGone]}
                testID={`enquiry-${lead.id}`}
                disabled={gone}
                onPress={() => (listing ? router.push(`/detail?id=${listing.id}`) : undefined)}
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

                {side === "received" ? (
                  <T weight={800} size={15} style={{ marginTop: 10 }} numberOfLines={1}>
                    {who}
                  </T>
                ) : null}

                <T
                  weight={side === "received" ? 500 : 800}
                  size={side === "received" ? 12 : 15}
                  color={side === "received" ? colors.muted : colors.ink}
                  style={{ marginTop: side === "received" ? 3 : 10 }}
                  numberOfLines={2}
                >
                  {side === "received" ? `About: ${title}` : title}
                </T>

                {gone ? (
                  <T weight={700} size={11} color={colors.faint} style={{ marginTop: 5 }}>
                    This listing has been removed.
                  </T>
                ) : null}

                {lead.message?.trim() ? (
                  <View style={styles.quote}>
                    <T weight={500} size={13.5} color="#383838" style={{ lineHeight: 20 }}>
                      {lead.message.trim()}
                    </T>
                  </View>
                ) : (
                  <T weight={500} size={12.5} color={colors.faint} style={{ marginTop: 10 }}>
                    {side === "received"
                      ? "No message — the buyer asked for your contact details."
                      : "No message — you asked for the seller's contact details."}
                  </T>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : myLeads.length === 0 && mySentLeads.length === 0 ? (
        // Both sides empty: one state that covers both, rather than telling a
        // buyer to wait for enquiries they will never receive.
        <Empty
          title="Nothing here yet"
          body="Message a seller about a property and it appears under Sent. If you list a property, buyers who contact you appear under Received."
        />
      ) : side === "received" ? (
        <Empty
          title="No enquiries received"
          body="When a buyer messages, requests your number or asks to visit one of your listings, it appears here."
        />
      ) : (
        <Empty
          title="You have not contacted anyone yet"
          body="Open a property and tap Message to ask the seller about it."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderRadius: 999,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  switchBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnOn: { backgroundColor: colors.black },
  row: {
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    ...shadow.soft,
  },
  rowGone: { backgroundColor: "#fbfbfa" },
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
