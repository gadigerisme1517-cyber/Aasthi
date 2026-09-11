import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InitialAvatar } from "@/src/components/initial-avatar";
import { StoreTile } from "@/src/components/store-tile";
import { Empty, Screen, T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { statusOf } from "@/src/lib/listing-facts";
import { Icon } from "@/src/icons";
import { colour, radius as r, weight as w } from "@/src/theme/tokens";
import { useApp } from "@/src/store/AppContext";

// ONE storefront template, for a buyer and for its owner.
//
// SOCIAL, NOT CORPORATE. A cover strip, a face, three numbers a person can
// actually check, Follow and Message. The full-width black slab is gone: a
// black header is a brochure, and this is a shop someone follows.
//
// THE PRICE RANGE IS DELETED, not hidden. It capped the agent — a store
// reading "₹18L – ₹1.3Cr" tells a buyer with three crore to spend to go
// somewhere else — and no shopkeeper would choose to advertise a ceiling.
//
// NOT HERE, AND NOT UNTIL THERE IS DATA: rating, stars, review count, years
// in market, response rate, response time. There is no reviews collection,
// and a self-declared number is the same unverifiable claim as the hardcoded
// 4.9 this app already deleted once.

const GREEN = colour.green;

export type StorefrontIdentity = {
  key: string | number | undefined; // uid for a real agent, numeric id for a seeded one
  uid?: string;
  name: string;
  avatar?: string;
  cover?: string;
  verified?: boolean;
  city?: string;
  area?: string;
  bio?: string;
  // "Agent", "Broker", "Builder"… from /property-partner. Only the owner's own
  // store can supply it: a buyer reads a store off the fields denormalised
  // onto its listings, and the partner type is not one of them.
  kind?: string;
  // Epoch ms the account was created. OWNER ONLY — users/{uid} is readable by
  // its owner alone, so a buyer cannot see when someone else joined.
  since?: number;
  // Accounts following this store. NOT READABLE TODAY: savedSellers lives on
  // each user's own document and the rules keep that private, so no client
  // query can count it. Left undefined, and the cell renders "–" rather than
  // a number nobody can stand behind.
  followers?: number;
};

function monthYear(ms?: number): string | null {
  if (!ms || !Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function postedThisWeek(items: Listing[]): number {
  const cutoff = Date.now() - 7 * 86400000;
  return items.filter((l) => {
    const seconds = (l as any).createdAt?.seconds;
    return seconds ? seconds * 1000 >= cutoff : false;
  }).length;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <T weight={w.title} size={16}>
        {value}
      </T>
      <T weight={w.body} size={11.5} color={colour.ink3} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

export function Storefront({
  identity,
  listings,
  isOwner,
}: {
  identity: StorefrontIdentity;
  // Everything this store has, INCLUDING hidden and sold. The component
  // filters per audience, so a buyer can never receive a hidden listing.
  listings: Listing[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    myLeads,
    mySentLeads,
    unreadLeadCount,
    isSellerSaved,
    toggleSaveSeller,
    isSaved,
    toggleSave,
    iOwn,
    showToast,
  } = useApp();

  // The agent previewing his own store. A mode switch, not a route.
  const [viewAsBuyer, setViewAsBuyer] = useState(false);
  const owning = isOwner && !viewAsBuyer;

  const [chip, setChip] = useState("All");

  // WHAT EACH AUDIENCE MAY EVER SEE.
  //
  // A buyer never receives a hidden listing, on any tab. Sold ones survive
  // this filter because the Sold tab needs them; the live grid excludes them
  // separately, below.
  const visible = useMemo(
    () => (isOwner ? listings : listings.filter((l) => !(l as any).hidden)),
    [listings, isOwner],
  );

  // In buyer preview the agent must see exactly what a buyer sees, so preview
  // re-applies the buyer filter over their own full list.
  const audienceListings = useMemo(
    () => (owning ? visible : visible.filter((l) => !(l as any).hidden)),
    [visible, owning],
  );

  // The live grid: everything that is neither sold nor hidden. This is what
  // "All" and every type tab count and show.
  const liveListings = useMemo(
    () => audienceListings.filter((l) => statusOf(l) !== "sold" && statusOf(l) !== "hidden"),
    [audienceListings],
  );

  const soldListings = useMemo(
    () => audienceListings.filter((l) => statusOf(l) === "sold"),
    [audienceListings],
  );

  const TYPES = ["Buy", "Rent", "Plots", "Commercial"] as const;
  const chips = useMemo(() => {
    const base = [
      { key: "All", count: liveListings.length },
      ...TYPES.map((t) => ({
        key: t,
        count: liveListings.filter((l) => l.type === t).length,
      })),
    ].filter((c) => c.key === "All" || c.count > 0);
    // Sold gets its own tab for BOTH audiences — a shop that has sold things
    // is worth saying so, and it keeps sold stock out of the live grid.
    if (soldListings.length) base.push({ key: "Sold", count: soldListings.length });
    if (owning) {
      const hidden = listings.filter((l) => (l as any).hidden).length;
      if (hidden) base.push({ key: "Hidden", count: hidden });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveListings, soldListings, listings, owning]);

  const shown = useMemo(() => {
    // GATED ON `owning`, not merely on the chip being rendered. The Hidden
    // chip is only drawn for an owner, but `chip` is state: selecting Hidden
    // and then tapping "View as buyer" left the selection behind and showed
    // hidden listings inside the preview that claims to be the buyer's view.
    if (chip === "Hidden") return owning ? listings.filter((l) => (l as any).hidden) : liveListings;
    if (chip === "Sold") return soldListings;
    if (chip === "All") return liveListings;
    return liveListings.filter((l) => l.type === chip);
  }, [chip, liveListings, soldListings, listings, owning]);

  const storeLeads = useMemo(() => (isOwner ? myLeads : []), [isOwner, myLeads]);
  const thisWeek = useMemo(() => postedThisWeek(liveListings), [liveListings]);
  const since = monthYear(identity.since);
  const following = isSellerSaved(identity.key as any);

  const onShare = () => {
    const link = identity.uid
      ? `aasthi:///seller?uid=${identity.uid}`
      : `aasthi:///seller?id=${identity.key}`;
    Share.share({ message: `${identity.name} on AASTHI\n${link}` }).catch(() =>
      showToast("Could not open the share sheet"),
    );
  };

  // MESSAGE opens the conversation that already exists with this seller. It
  // does NOT start one: a thread hangs off a lead, a lead is about a
  // property, and inventing one here would send the agent an inquiry about a
  // listing the buyer never opened — the exact thing "Send inquiry" was
  // removed from this screen for.
  const onMessage = () => {
    const key = identity.uid;
    const existing = (mySentLeads as any[]).find((l) => (key ? l.sellerUid === key : false));
    if (existing) {
      router.push(`/thread?id=${existing.id}`);
      return;
    }
    showToast("Open one of their properties and send an inquiry to start a conversation.");
  };

  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 0 }}>
      {/* ---------- COVER ---------- */}
      <View style={[styles.cover, { paddingTop: insets.top + 8 }]}>
        {identity.cover ? (
          <Image source={{ uri: identity.cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colour.shell }]} />
        )}
        <LinearGradient
          colors={["rgba(12,10,8,0.35)", "rgba(12,10,8,0.55)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.coverBar}>
          <Pressable
            style={styles.round}
            onPress={() => (viewAsBuyer ? setViewAsBuyer(false) : router.back())}
            testID="store-back"
          >
            <Icon name="arrowLeft" size={16} color={colour.paper} />
          </Pressable>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {owning ? (
              <Pressable style={styles.round} onPress={() => router.push("/menu")} testID="store-gear">
                <Icon name="gear" size={15} color={colour.paper} />
              </Pressable>
            ) : null}
            <Pressable style={styles.round} onPress={onShare} testID="store-share">
              <Icon name="share" size={14} color={colour.paper} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ---------- IDENTITY ---------- */}
      <View style={styles.identity}>
        <InitialAvatar
          uri={identity.avatar}
          name={identity.name}
          size={64}
          radius={16}
          fontSize={24}
          style={styles.avatar}
        />
        <View style={styles.nameRow}>
          <T weight={w.title} size={19} ls={-0.3} numberOfLines={1} style={{ flexShrink: 1 }}>
            {identity.name}
          </T>
          {identity.verified ? (
            <View style={styles.tick}>
              <Icon name="check" size={11} color={colour.paper} />
            </View>
          ) : null}
        </View>

        {/* "Property dealer in Kurnool". RENDERS NOTHING when there is no
            city — the seeded sellers have never had one, and both "Property
            dealer in" and a stand-in city would be worse than silence. The
            moment a city exists on the record this line appears, with no
            further change to this file. */}
        {identity.city?.trim() ? (
          <T weight={w.body} size={12.5} color={colour.ink2} numberOfLines={1} style={{ marginTop: 3 }}>
            {`${identity.kind?.trim() || "Property dealer"} in ${identity.city.trim()}`}
          </T>
        ) : null}

        {/* EXACTLY THREE, and not one of them is a claim about quality. */}
        <View style={styles.stats}>
          <Stat
            value={String(liveListings.length)}
            label={liveListings.length === 1 ? "Listing" : "Listings"}
          />
          <Stat
            value={typeof identity.followers === "number" ? String(identity.followers) : "–"}
            label="Followers"
          />
          <Stat value={since ?? "–"} label="On AASTHI" />
        </View>

        {identity.bio?.trim() ? (
          <T weight={w.body} size={13} color={colour.ink2} numberOfLines={3} style={styles.bio}>
            {identity.bio.trim()}
          </T>
        ) : null}

        <View style={styles.actions}>
          {owning ? (
            <>
              <Pressable style={[styles.btn, styles.btnInk]} onPress={() => router.push("/sell")} testID="store-add">
                <T weight={w.title} size={14.5} color={colour.paper}>
                  Add a property
                </T>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setViewAsBuyer(true)}
                testID="store-view-as-buyer"
              >
                <T weight={w.title} size={14.5} color={colour.ink2}>
                  View as buyer
                </T>
              </Pressable>
            </>
          ) : (
            <>
              {/* Follow IS savedSellers. Same field, same write — the control
                  was called Save, and what it does is follow a shop. */}
              {isOwner ? null : (
                <Pressable
                  style={[styles.btn, following ? styles.btnGhost : styles.btnInk]}
                  onPress={() => identity.key !== undefined && toggleSaveSeller(identity.key as any)}
                  testID="store-follow"
                >
                  <T weight={w.title} size={14.5} color={following ? colour.ink2 : colour.paper}>
                    {following ? "Following" : "Follow"}
                  </T>
                </Pressable>
              )}
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={onMessage} testID="store-message">
                <T weight={w.title} size={14.5} color={colour.ink2}>
                  Message
                </T>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* ---------- ACTIVITY, buyer side, and only when it is true ---------- */}
      {!owning && thisWeek > 0 ? (
        <View style={styles.activity} testID="store-activity">
          <View style={styles.dot} />
          <T weight={w.body} size={12.5} color={colour.ink2}>
            {`Posted ${thisWeek} listing${thisWeek === 1 ? "" : "s"} this week`}
          </T>
        </View>
      ) : null}

      <View style={styles.body}>
        {owning ? (
          <Pressable onPress={() => router.push("/account")} testID="store-edit-identity">
            <T weight={w.label} size={13} color={colour.ink3}>
              Edit photo, name, area and bio
            </T>
          </Pressable>
        ) : (
          // The number is NOT on this screen in any form — not masked, not
          // partial, not behind a tap. It unlocks on the listing, through the
          // same inquiry gate /detail already uses.
          <T weight={w.body} size={12} color={colour.ink3} style={{ lineHeight: 17 }}>
            The phone number appears once you send an inquiry.
          </T>
        )}

        {/* ---------- INQUIRIES, owner only, above the catalogue ---------- */}
        {owning ? (
          <View style={{ marginTop: 16 }}>
            <T weight={w.title} size={19} ls={-0.5}>
              Inquiries
            </T>
            {storeLeads.length ? (
              <Pressable
                style={styles.strip}
                onPress={() => router.push("/my-enquiries")}
                testID="store-inquiry-strip"
              >
                <T weight={w.title} size={14} color={colour.paper}>
                  {unreadLeadCount > 0
                    ? `${unreadLeadCount} New ${unreadLeadCount === 1 ? "inquiry" : "inquiries"}`
                    : `${storeLeads.length} ${storeLeads.length === 1 ? "inquiry" : "inquiries"}`}
                </T>
                <T weight={w.title} size={13} color={colour.paper}>
                  Open
                </T>
              </Pressable>
            ) : (
              <View testID="store-inquiry-empty">
                <T weight={w.body} size={13} color={colour.ink3} style={{ marginTop: 6, lineHeight: 19 }}>
                  Buyers who contact you will show up here.
                </T>
              </View>
            )}
          </View>
        ) : null}

        {/* ---------- CATALOGUE ---------- */}
        <View style={styles.sectionHead}>
          <T weight={w.title} size={19} ls={-0.5}>
            All properties
          </T>
          <T weight={w.label} size={12} color={colour.ink3}>
            Newest first
          </T>
        </View>

        <View style={styles.chipRow}>
          {chips.map((c) => {
            const on = c.key === chip;
            return (
              <Pressable
                key={c.key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setChip(c.key)}
                testID={`store-chip-${c.key}`}
              >
                <T weight={w.label} size={12.5} color={on ? colour.paper : colour.ink}>
                  {c.key} {c.count}
                </T>
              </Pressable>
            );
          })}
        </View>

        {shown.length ? (
          <View style={styles.grid}>
            {shown.map((l) => (
              <StoreTile
                key={l.id}
                listing={l}
                onPress={() => router.push(`/detail?id=${l.id}`)}
                // OWNERSHIP, never mode. In buyer preview of your own store
                // neither control appears, which is correct: you are not a
                // buyer of your own property.
                onManage={owning ? () => router.push(`/edit-listing?id=${l.id}`) : undefined}
                saved={isSaved(l.id)}
                onToggleSave={iOwn(l) ? undefined : () => toggleSave(l.id)}
                // STATE IS OWNER-ONLY. A buyer gets no status word at all:
                // hidden never reaches them, sold only under its own tab, and
                // "Pending verification" on a stranger's tile reads as a
                // fault in the property rather than in the paperwork — the
                // missing tick already says what there is to say.
                state={owning ? statusOf(l) : undefined}
              />
            ))}
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            <Empty
              title={owning ? "Nothing here yet" : "No listings right now"}
              body={
                owning
                  ? "Tap Add a property to put your first one up."
                  : "This store has nothing under that filter."
              }
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 88, justifyContent: "flex-start" },
  coverBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  round: {
    width: 30,
    height: 30,
    borderRadius: r.pill,
    backgroundColor: colour.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { backgroundColor: colour.paper, paddingHorizontal: 16, paddingBottom: 14 },
  avatar: { marginTop: -26, borderWidth: 3, borderColor: colour.paper },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  tick: {
    width: 16,
    height: 16,
    borderRadius: r.pill,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { flexDirection: "row", gap: 20, marginTop: 14 },
  bio: { marginTop: 12, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: r.md, paddingVertical: 14, alignItems: "center" },
  btnInk: { backgroundColor: colour.ink },
  btnGhost: { borderWidth: 1, borderColor: colour.line },
  activity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colour.paper,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  body: { paddingHorizontal: 16, paddingTop: 14 },
  strip: {
    marginTop: 10,
    backgroundColor: colour.ink,
    borderRadius: r.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 22,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    borderRadius: r.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colour.shell,
  },
  chipOn: { backgroundColor: colour.ink },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 14,
  },
});
