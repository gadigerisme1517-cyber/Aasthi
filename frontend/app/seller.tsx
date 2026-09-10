import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking as RNLinking, Pressable, Share, StyleSheet, View } from "react-native";

import { ResultCard } from "@/src/components/cards";
import { Block, Empty, PageHead, Screen, T } from "@/src/components/ui";
import { ShopCover, ShopIdentity, ShopStats, ShopTabs, memberSince } from "@/src/components/shop";
import { Icon } from "@/src/icons";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// The public shop. Same cover, identity, badges and three stats as the
// owner's own view in /(tabs)/profile — but WITHOUT the view and enquiry
// counts, which are the seller's business and nobody else's.
//
// Two kinds of seller arrive here: a seeded one by ?id=, and a real
// publisher by ?uid=. A publisher's details are reconstructed from their own
// listings, because firestore.rules restricts users/{uid} to its owner.

export default function SellerDetail() {
  const router = useRouter();
  const { id, uid } = useLocalSearchParams<{ id?: string; uid?: string }>();
  const {
    sellers,
    listings,
    listingsBySeller,
    sellerOf,
    blocked,
    toggleBlock,
    showToast,
    contactedListingIds,
  } = useApp();
  const [tab, setTab] = useState("live");

  const userListings = uid ? listings.filter((l) => (l as any).sellerUid === uid) : [];
  const seller = uid
    ? userListings.length
      ? sellerOf(userListings[0])
      : undefined
    : sellers.find((s) => s.id === Number(id));
  const mine = uid ? userListings : listingsBySeller(seller?.id ?? -999);

  const blockKey = uid ?? seller?.id;
  const isBlocked = blockKey !== undefined && blocked.includes(blockKey);

  if (!seller) {
    return (
      <Screen header={<PageHead title="Seller" onBack={() => router.back()} />}>
        <Empty title="Seller not found" body="This seller may have been removed." />
      </Screen>
    );
  }

  const live = mine.filter((l) => ((l as any).saleStatus ?? "live") !== "sold");
  const sold = mine.filter((l) => (l as any).saleStatus === "sold");

  // The number is earned on the SHOP the same way it is earned on a listing:
  // only after this buyer has actually contacted one of this seller's
  // properties. Seeded sellers carry no phone at all, so their shops never
  // show a Call button — which is honest, there is no number to give.
  const phone = (seller as any).phone?.trim?.() ?? "";
  const contactedThisSeller = mine.some((l) => contactedListingIds.includes(l.id));
  const canCall = Boolean(phone) && contactedThisSeller;
  const enquiryTarget = live[0] ?? mine[0];

  const share = async () => {
    // NO FABRICATED WEB URL. aasthi.in does not exist. This is a real deep
    // link built from the "aasthi" scheme in app.json, so it opens this shop
    // for anyone who already has the app installed. See the report for the
    // limit that leaves.
    const link = uid
      ? Linking.createURL("/seller", { queryParams: { uid } })
      : Linking.createURL("/seller", { queryParams: { id: String(seller.id) } });
    await Share.share({
      message:
        `${seller.name} on AASTHI — ${live.length} ${live.length === 1 ? "property" : "properties"} ` +
        `for sale${seller.meta ? ` · ${seller.meta}` : ""}.\n${link}`,
    });
  };

  return (
    <Screen header={<PageHead title="Seller" onBack={() => router.back()} />}>
      <ShopCover uri={seller.cover} />
      <ShopIdentity
        avatar={seller.img}
        name={seller.name}
        businessName={undefined}
        city={seller.meta}
        verified={seller.verified}
        reraId={undefined}
      />
      <ShopStats
        stats={[
          { value: String(live.length), label: "Live listings" },
          { value: String(sold.length), label: "Sold" },
          // Another seller's createdAt is not readable from here, so a
          // private publisher shows a dash rather than a made-up date.
          // Seeded sellers have no such field at all.
          { value: memberSince(undefined), label: "Member since" },
        ]}
      />

      <View style={styles.contactRow}>
        {canCall ? (
          <Pressable
            style={[styles.contactBtn, styles.contactPrimary]}
            onPress={() => RNLinking.openURL(`tel:${phone.replace(/\s+/g, "")}`)}
            testID="seller-call"
          >
            <Icon name="phone" size={15} color="#fff" />
            <T weight={900} size={12.5} color="#fff">
              Call {phone}
            </T>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.contactBtn, styles.contactPrimary, !enquiryTarget && styles.contactDisabled]}
            disabled={!enquiryTarget}
            onPress={() => router.push(`/enquiry?id=${enquiryTarget.id}`)}
            testID="seller-enquire"
          >
            <Icon name="message" size={15} color="#fff" />
            <T weight={900} size={12.5} color="#fff">
              {enquiryTarget ? "Send an inquiry" : "No listings to inquire about"}
            </T>
          </Pressable>
        )}
        <Pressable style={styles.contactBtn} onPress={share} testID="seller-share">
          <Icon name="globe" size={15} color={colors.ink} />
          <T weight={900} size={12.5}>
            Share
          </T>
        </Pressable>
      </View>

      <ShopTabs
        tabs={[
          { key: "live", label: "Live", count: live.length },
          { key: "sold", label: "Sold", count: sold.length },
          { key: "about", label: "About" },
        ]}
        active={tab}
        onSelect={setTab}
      />

      <View style={{ marginTop: 14 }}>
        {tab === "live" ? (
          live.length ? (
            <View style={{ gap: 14 }}>
              {live.map((l) => (
                <ResultCard key={l.id} listing={l} onPress={() => router.push(`/detail?id=${l.id}`)} />
              ))}
            </View>
          ) : (
            <Empty title="No active listings" body="This seller has no live properties right now." />
          )
        ) : null}

        {tab === "sold" ? (
          sold.length ? (
            <View style={{ gap: 14 }}>
              {sold.map((l) => (
                <ResultCard key={l.id} listing={l} onPress={() => router.push(`/detail?id=${l.id}`)} />
              ))}
            </View>
          ) : (
            <Empty title="No completed sales yet." body="Properties this seller has sold will be listed here." />
          )
        ) : null}

        {tab === "about" ? (
          <Block>
            <AboutRow label="Seller" value={seller.name} />
            <AboutRow label="Details" value={seller.meta} />
            <AboutRow label="Trust" value={seller.trust} />
            <AboutRow label="Member since" value={memberSince(undefined)} />
          </Block>
        ) : null}
      </View>

      {/* Kept from last pass: works for seeded sellers by numeric id and for
          private publishers by uid. */}
      {blockKey !== undefined ? (
        <Pressable
          style={styles.blockRow}
          onPress={() => {
            toggleBlock(blockKey);
            showToast(isBlocked ? `Unblocked ${seller.name}` : `Blocked ${seller.name}`);
          }}
          testID="seller-block-toggle"
        >
          <T weight={700} size={12} color={isBlocked ? colors.ink : colors.red}>
            {isBlocked ? "Unblock this seller" : "Block this seller"}
          </T>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function AboutRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <View style={styles.aboutRow}>
      <T weight={800} size={12} color={colors.muted}>
        {label}
      </T>
      <T weight={700} size={13.5} style={{ marginTop: 3 }}>
        {String(value ?? "").trim() || "-"}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  contactRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  contactBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
    ...shadow.soft,
  },
  contactPrimary: { backgroundColor: colors.black, borderColor: colors.black },
  contactDisabled: { opacity: 0.5 },
  aboutRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  blockRow: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.result,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
});
