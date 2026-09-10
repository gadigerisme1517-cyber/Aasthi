import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";

import {
  Block,
  Button,
  Empty,
  ListingStatusTag,
  MenuRow,
  PageHead,
  SaleStatusTag,
  Screen,
  SectionLabel,
  T,
} from "@/src/components/ui";
import { ShopCover, ShopIdentity, ShopStats, ShopTabs, memberSince } from "@/src/components/shop";
import { Icon, IconName } from "@/src/icons";
import { auth } from "@/src/services/firebase";
import { colors, radius, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";
import { FEATURES } from "@/src/config";

// /profile is the seller's own shop front, with the account menu underneath.
// It is NOT a settings list any more — but every row that used to be here is
// still here, moved into the ACCOUNT / SUPPORT / SESSION sections at the
// bottom. Nothing was removed.

function QuickAction({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable style={styles.action} onPress={onPress} testID={testID}>
      <Icon name={icon} size={17} color={colors.ink} />
      <T weight={850} size={11.5} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, myListings, myLeads, enquiryCountFor } = useApp();
  const [tab, setTab] = useState("live");

  const uid = auth.currentUser?.uid ?? "";
  const hasShop = myListings.length > 0;

  const live = myListings.filter((l) => ((l as any).saleStatus ?? "live") !== "sold");
  const sold = myListings.filter((l) => (l as any).saleStatus === "sold");

  // Cover: their own, else their first listing's photo, else nothing. Never a
  // stock photo standing in for a property they do not have.
  const cover = user.cover || myListings[0]?.img || undefined;

  const share = async () => {
    // There is no aasthi.in, so no web URL is fabricated here. This is a REAL
    // deep link — expo-linking builds it from the "aasthi" scheme in
    // app.json, so it opens the shop for anyone who already has the app.
    // Someone without the app gets text only, and that is the honest limit.
    const link = Linking.createURL("/seller", { queryParams: { uid } });
    const who = user.businessName?.trim() || user.name || "this seller";
    await Share.share({
      message:
        `${who} on AASTHI — ${live.length} ${live.length === 1 ? "property" : "properties"} ` +
        `for sale in ${user.city || "Kurnool"}.\n${link}`,
    });
  };

  const OwnerRow = ({ l }: { l: any }) => {
    // Views is a dash when the field is absent — a listing published before
    // counting existed was not viewed zero times, it was never counted.
    const views = typeof l.views === "number" ? String(l.views) : "-";
    const enquiries = enquiryCountFor(l.id);
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/edit-listing?id=${l.id}`)}
        testID={`shop-listing-${l.id}`}
      >
        <Image source={{ uri: l.img }} style={styles.thumb} contentFit="cover" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T weight={900} size={16} ls={-0.5} numberOfLines={1}>
            {l.price}
          </T>
          <T weight={700} size={12.5} numberOfLines={2} style={{ marginTop: 2 }}>
            {l.title}
          </T>
          <View style={styles.tagRow}>
            <ListingStatusTag status={l.verificationStatus} compact />
            <SaleStatusTag status={l.saleStatus} compact />
          </View>
          {/* OWNER ONLY. Nothing renders these on a buyer's screen. */}
          <View style={styles.metrics} testID={`shop-metrics-${l.id}`}>
            <T weight={800} size={11} color={colors.muted}>
              {views} {views === "1" ? "view" : "views"}
            </T>
            <T weight={800} size={11} color={colors.muted}>
              ·
            </T>
            <T weight={800} size={11} color={colors.muted}>
              {enquiries} {enquiries === 1 ? "inquiry" : "inquiries"}
            </T>
          </View>
        </View>
        <Icon name="chev" size={16} color={colors.faint} />
      </Pressable>
    );
  };

  return (
    <Screen header={<PageHead title="Profile" onBack={() => router.push("/(tabs)")} />}>
      {hasShop ? (
        <>
          <ShopCover uri={cover} onEdit={() => router.push("/account")} />
          <ShopIdentity
            avatar={user.avatar}
            name={user.name || "AASTHI member"}
            businessName={user.businessName}
            city={user.city}
            verified={user.verified}
            reraId={(user as any).reraId}
          />
          <ShopStats
            stats={[
              { value: String(live.length), label: "Live listings" },
              { value: String(sold.length), label: "Sold" },
              { value: memberSince(user.createdAt), label: "Member since" },
            ]}
          />

          <View style={styles.shopActions}>
            <Pressable
              style={styles.shopBtn}
              onPress={() => router.push(`/seller?uid=${uid}`)}
              testID="shop-view-as-buyer"
            >
              <Icon name="user" size={15} color={colors.ink} />
              <T weight={900} size={12}>
                View as buyer
              </T>
            </Pressable>
            <Pressable style={styles.shopBtn} onPress={share} testID="shop-share">
              <Icon name="globe" size={15} color={colors.ink} />
              <T weight={900} size={12}>
                Share shop
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
                <View style={{ gap: 12 }}>
                  {live.map((l) => (
                    <OwnerRow key={l.id} l={l} />
                  ))}
                </View>
              ) : (
                <Empty title="Nothing live right now" body="Everything you listed has been sold. Tap List to add another property." />
              )
            ) : null}

            {tab === "sold" ? (
              sold.length ? (
                <View style={{ gap: 12 }}>
                  {sold.map((l) => (
                    <OwnerRow key={l.id} l={l} />
                  ))}
                </View>
              ) : (
                <Empty title="No completed sales yet." body="Mark a property Sold from its editor and it moves here, off Home and Search." />
              )
            ) : null}

            {tab === "about" ? (
              <Block>
                <AboutRow label="Operating areas" value={user.operatingAreas} />
                <AboutRow label="Partner type" value={user.partnerType} />
                <AboutRow label="Member since" value={memberSince(user.createdAt)} />
                <AboutRow label="City" value={user.city} />
              </Block>
            ) : null}
          </View>
        </>
      ) : (
        // No listings: do not show an empty shop. One clear invitation, then
        // the account menu. The shop appears the moment they publish.
        <View style={styles.firstBlock} testID="shop-first-listing">
          <T weight={800} size={20} ls={-0.6}>
            {user.name || "AASTHI member"}
          </T>
          <T weight={500} size={13} color={colors.muted} style={{ marginTop: 6, lineHeight: 19 }}>
            You have not listed a property yet. Publish one and this becomes
            your shop — cover photo, your listings, what sold, and the view and
            inquiry counts on each.
          </T>
          <Button label="List your first property" onPress={() => router.push("/sell")} style={{ marginTop: 14 }} testID="shop-list-first" />
        </View>
      )}

      <SectionLabel>Selling</SectionLabel>
      <View style={styles.actionGrid}>
        <QuickAction icon="heart" label="Saved" onPress={() => router.push("/(tabs)/saved")} testID="profile-saved" />
        <QuickAction icon="inbox" label="Enquiries" onPress={() => router.push("/my-enquiries")} testID="profile-enquiries" />
        <QuickAction icon="plus" label="List" onPress={() => router.push("/sell")} testID="profile-list" />
        {FEATURES.premium ? (
          <QuickAction icon="star" label="Premium" onPress={() => router.push("/premium")} testID="profile-premium" />
        ) : null}
      </View>
      <MenuRow
        icon="home"
        title="My listings"
        sub={
          myListings.length === 0
            ? "No properties published yet"
            : myListings.length === 1
              ? "1 property · tap to edit or remove"
              : `${myListings.length} properties · tap to edit or remove`
        }
        onPress={() => router.push("/my-listings")}
        testID="menu-my-listings"
      />
      <MenuRow
        icon="inbox"
        title="My inquiries"
        sub={
          myLeads.length === 0
            ? "Buyers who contact you appear here"
            : myLeads.length === 1
              ? "1 buyer has contacted you"
              : `${myLeads.length} buyers have contacted you`
        }
        onPress={() => router.push("/my-enquiries")}
        testID="menu-my-enquiries"
      />
      <MenuRow icon="shield" title="Property Partner" sub="Sell professionally on AASTHI" onPress={() => router.push("/property-partner")} testID="menu-partner" />

      <SectionLabel>Account</SectionLabel>
      <MenuRow icon="user" title="Account" sub="Name, cover, phone, email, city" onPress={() => router.push("/account")} testID="menu-account" />
      <MenuRow icon="shield" title="Get verified" sub="Upload documents for a Verified badge" onPress={() => router.push("/verify")} testID="menu-verify" />
      {FEATURES.notificationPrefs ? (
        <MenuRow icon="bell" title="Notifications" sub="Alerts, price drops, messages" onPress={() => router.push("/notif-prefs")} testID="menu-notif" />
      ) : null}
      <MenuRow icon="shield" title="Privacy" sub="Visibility, data, password" onPress={() => router.push("/privacy")} testID="menu-privacy" />
      <MenuRow icon="gear" title="Settings" sub="Storage and app preferences" onPress={() => router.push("/settings")} testID="menu-settings" />

      <SectionLabel>Support</SectionLabel>
      <MenuRow icon="lifebuoy" title="Help & Support" sub="FAQs and report a bug" onPress={() => router.push("/help")} testID="menu-help" />
      <MenuRow icon="info" title="About AASTHI" sub="Version, terms, policy" onPress={() => router.push("/about")} testID="menu-about" />

      <SectionLabel>Session</SectionLabel>
      <MenuRow icon="logout" title="Log out" sub="You'll need to sign in again" danger onPress={() => router.push("/logout-confirm")} testID="menu-logout" />
    </Screen>
  );
}

function AboutRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.aboutRow}>
      <T weight={800} size={12} color={colors.muted}>
        {label}
      </T>
      <T weight={700} size={13.5} style={{ marginTop: 3 }}>
        {value?.trim() || "-"}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  shopActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  shopBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    ...shadow.soft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.result,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    ...shadow.soft,
  },
  thumb: { width: 78, height: 78, borderRadius: 14 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  metrics: { flexDirection: "row", gap: 6, marginTop: 7, alignItems: "center" },
  actionGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  action: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    ...shadow.soft,
  },
  firstBlock: {
    marginTop: 12,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    ...shadow.soft,
  },
  aboutRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
});
