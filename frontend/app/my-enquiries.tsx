import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThreadRow, threadRowStyles } from "@/src/components/thread-row";
import { Empty, PageHead, Screen, SectionHead, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// A CONVERSATION LIST, not a stack of filed inquiries.
//
// Every row used to be a bordered card with a type pill, a quoted message
// block and a Call button — a document ABOUT a conversation rather than the
// conversation. It is now one row per thread: who, what was last said, when.
// The row component is shared with the storefront's inquiry strip so the two
// surfaces cannot drift into looking like different products.
//
// RECEIVED is the seller's side, SENT is the buyer's, and that split is why
// this screen earns a nav slot: most users never publish anything, so a
// received-only screen would be permanently empty for the majority.
//
// THE CALL BUTTON MOVED INTO THE THREAD. It was not dropped — a number a
// buyer chose to share has to stay one tap from the agent, and the reply
// stamp still rides on it.

type Side = "received" | "sent";

export default function MyEnquiries() {
  const router = useRouter();
  const { myLeads, mySentLeads, listings, myListings, isLeadUnread, isThreadUnread } = useApp();

  // Open on the side that has something to show. A user who has never listed
  // anything is a buyer, and Received would be empty for them forever.
  const [side, setSide] = useState<Side>(myListings.length ? "received" : "sent");

  const rows = side === "received" ? myLeads : mySentLeads;

  return (
    <Screen header={<PageHead title="Inquiries" onBack={() => router.back()} />}>
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
              <T weight={700} size={12} color={on ? colors.white : colors.ink}>
                {s === "received" ? "Received" : "Sent"}
                {count ? ` (${count})` : ""}
              </T>
            </Pressable>
          );
        })}
      </View>

      <SectionHead
        title={side === "received" ? "Inquiries on your listings" : "Inquiries you sent"}
        sub={
          side === "received"
            ? "Buyers who contacted you, newest first."
            : "Properties you contacted, newest first."
        }
      />

      {rows.length ? (
        // Full-bleed: the hairlines run edge to edge, so the list is pulled
        // out of the screen's horizontal padding and each row puts it back.
        <View style={styles.list}>
          {rows.map((lead: any, i: number) => {
            const listing = listings.find((l) => l.id === lead.listingId);
            const received = side === "received";
            const name = received
              ? lead.buyerName?.trim() || "AASTHI buyer"
              : lead.sellerName?.trim() || (listing as any)?.sellerName?.trim() || "AASTHI seller";
            return (
              <View key={lead.id}>
                {i > 0 ? <View style={threadRowStyles.divider} /> : null}
                <View style={styles.rowPad}>
                  <ThreadRow
                    lead={lead}
                    // Which side of this lead this row is rendering, so the
                    // preview can say "You:" when the last word was ours.
                    meUid={received ? lead.sellerUid : lead.buyerUid}
                    unread={received ? isLeadUnread(lead) : isThreadUnread(lead.id)}
                    name={name}
                    // Only the Sent side has a picture to show: a lead carries
                    // no avatar for the buyer who sent it.
                    avatar={received ? undefined : (listing as any)?.sellerAvatar}
                    onPress={() => router.push(`/thread?id=${lead.id}`)}
                    testID={`enquiry-${lead.id}`}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : myLeads.length === 0 && mySentLeads.length === 0 ? (
        // Both sides empty: one state that covers both, rather than telling a
        // buyer to wait for enquiries they will never receive.
        <Empty
          title="Nothing here yet"
          body="Send an inquiry about a property and it appears under Sent. If you list a property, buyers who contact you appear under Received."
        />
      ) : side === "received" ? (
        <Empty
          title="No inquiries received"
          body="When a buyer sends an inquiry, requests your number or asks to visit one of your listings, it appears here."
        />
      ) : (
        <Empty
          title="You have not contacted anyone yet"
          body="Open a property and tap Inquiry to ask the seller about it."
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
  list: { marginHorizontal: -18 },
  rowPad: { paddingHorizontal: 18 },
});
