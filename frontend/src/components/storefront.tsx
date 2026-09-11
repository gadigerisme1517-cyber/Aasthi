import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StoreTile } from "@/src/components/store-tile";
import { ThreadRow, threadRowStyles } from "@/src/components/thread-row";
import { Empty, Screen, T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// ONE storefront template. There is no second agent page in the app.
//
// It reads as a SHOP now, not a profile: a black header slab carrying the
// identity and a three-cell store bar, then a two-column catalogue. A
// profile lists what someone posted, in order, forever. A shop states what it
// is, what it has and what it costs, and shows the goods in a grid.
//
// The same component still renders both audiences. The agent's version ADDS
// controls — the edit line, the gear, the inquiry strip and the per-tile
// overflow button — and reorders nothing, so "View as buyer" is the identical
// screen minus the owner's own controls. That switch is local state, not a
// route.

const VERIFIED_GREEN = "#12a05e";
const WHITE_25 = "rgba(255,255,255,0.25)";
const WHITE_18 = "rgba(255,255,255,0.18)";
const WHITE_55 = "rgba(255,255,255,0.55)";
const WHITE_50 = "rgba(255,255,255,0.5)";

export type StorefrontIdentity = {
  key: string | number | undefined; // uid for a real agent, numeric id for a seeded one
  uid?: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  city?: string;
  area?: string;
  bio?: string;
  // "Agent", "Broker", "Builder"… from /property-partner. Only the owner's own
  // store can supply it: a buyer reads a store off the fields denormalised
  // onto its listings, and the partner type is not one of them.
  kind?: string;
};

// ---- Price range, the most shop-like thing on the screen -------------------
//
// Parsed from the listing's own price STRING, because that is the only price
// this app stores. "₹1.34 Cr", "₹68 L" and "₹86,00,000" are all in use.
//
// RENT IS EXCLUDED ON PURPOSE. A store with a ₹42,000/mo flat and a ₹1.34 Cr
// villa has no single price range; putting them in one min–max would print a
// number that means nothing. If a store has only rentals the cell is dropped
// rather than filled with a mixed-unit lie.
function parsePrice(raw?: string): number | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[₹,\s]/g, "");
  if (t.includes("/mo") || t.includes("month")) return null;
  const m = t.match(/^([\d.]+)(cr|l|k)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return null;
  if (m[2] === "cr") return n * 1e7;
  if (m[2] === "l") return n * 1e5;
  if (m[2] === "k") return n * 1e3;
  return n;
}

function shortPrice(n: number): string {
  const trim = (x: number) => String(Math.round(x * 10) / 10).replace(/\.0$/, "");
  if (n >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${Math.round(n)}`;
}

function priceRangeOf(items: Listing[]): string | null {
  const nums = items.map((l) => parsePrice(l.price)).filter((n): n is number => n !== null);
  if (!nums.length) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? shortPrice(lo) : `${shortPrice(lo)} – ${shortPrice(hi)}`;
}

// Where the store works, off its own listings, when it has not declared a
// service area. Same basis as the seller cards on Home.
function localityOf(items: Listing[]): string | null {
  for (const l of items) {
    const first = (l.addr || "").split(",")[0].trim();
    if (first) return first;
  }
  return null;
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.cell}>
      <T weight={800} size={16} color={colors.white} numberOfLines={1}>
        {value}
      </T>
      <T weight={700} size={10.5} ls={0.74} color={WHITE_50} numberOfLines={1} style={styles.cellLabel}>
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
    isLeadUnread,
    isSellerSaved,
    toggleSaveSeller,
    isSaved,
    toggleSave,
    showToast,
  } = useApp();

  // The agent previewing his own store. A mode switch, not a route.
  const [viewAsBuyer, setViewAsBuyer] = useState(false);
  const owning = isOwner && !viewAsBuyer;

  const [chip, setChip] = useState("All");

  // What each audience may see.
  const visible = useMemo(
    () =>
      isOwner
        ? listings
        : listings.filter(
            (l) => !(l as any).hidden && ((l as any).saleStatus ?? "live") !== "sold",
          ),
    [listings, isOwner],
  );

  // In buyer preview the agent must see exactly what a buyer sees.
  const audienceListings = useMemo(
    () =>
      owning
        ? visible
        : visible.filter(
            (l) => !(l as any).hidden && ((l as any).saleStatus ?? "live") !== "sold",
          ),
    [visible, owning],
  );

  const TYPES = ["Buy", "Rent", "Plots", "Commercial"] as const;
  const chips = useMemo(() => {
    const base = [
      { key: "All", count: audienceListings.length },
      ...TYPES.map((t) => ({
        key: t,
        count: audienceListings.filter((l) => l.type === t).length,
      })),
    ].filter((c) => c.key === "All" || c.count > 0);
    if (owning) {
      const hidden = listings.filter((l) => (l as any).hidden).length;
      if (hidden) base.push({ key: "Hidden", count: hidden });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceListings, listings, owning]);

  const shown = useMemo(() => {
    if (chip === "Hidden") return listings.filter((l) => (l as any).hidden);
    if (chip === "All") return audienceListings;
    return audienceListings.filter((l) => l.type === chip);
  }, [chip, audienceListings, listings]);

  // Leads for THIS store, newest first. Only ever the agent's own — myLeads is
  // scoped to the signed-in user by the rules.
  const storeLeads = useMemo(() => (isOwner ? myLeads : []), [isOwner, myLeads]);

  // Opening the store does not mark anything read. Unread is per THREAD
  // (users.threadsSeenAt); reading happens in app/thread.tsx, one
  // conversation at a time.

  const range = useMemo(() => priceRangeOf(audienceListings), [audienceListings]);
  const worksIn = identity.area?.trim() || localityOf(audienceListings) || null;

  const onShare = () => {
    // A deep link, because AASTHI has no public web page for a store yet.
    // It opens the store for anyone who has the app; for anyone who does not
    // it is just text, which is honest — it does not pretend to be a URL.
    const link = identity.uid
      ? `aasthi:///seller?uid=${identity.uid}`
      : `aasthi:///seller?id=${identity.key}`;
    Share.share({ message: `${identity.name} on AASTHI\n${link}` }).catch(() =>
      showToast("Could not open the share sheet"),
    );
  };

  const initial = (identity.name.trim()[0] || "A").toUpperCase();

  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 0 }}>
      {/* ================= HEADER SLAB ================= */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.circle}
            onPress={() => (viewAsBuyer ? setViewAsBuyer(false) : router.back())}
            testID="store-back"
          >
            <Icon name="arrowLeft" size={17} color={colors.white} />
          </Pressable>
          <View style={styles.topRight}>
            {/* Owner keeps the gear here. Buyer preview shows share only —
                a preview that keeps an owner control is not the screen a
                buyer sees. */}
            {owning ? (
              <Pressable style={styles.circle} onPress={() => router.push("/menu")} testID="store-gear">
                <Icon name="gear" size={17} color={colors.white} />
              </Pressable>
            ) : null}
            <Pressable style={styles.circle} onPress={onShare} testID="store-share">
              <Icon name="share" size={16} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* ---- identity ---- */}
        <View style={styles.idRow}>
          {identity.avatar ? (
            <Image source={{ uri: identity.avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarLetter]}>
              <T weight={800} size={26} color={colors.ink}>
                {initial}
              </T>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.nameRow}>
              <T weight={800} size={22} ls={-0.7} color={colors.white} numberOfLines={1} style={{ flexShrink: 1 }}>
                {identity.name}
              </T>
              {identity.verified ? (
                // Inverted for the dark slab: the check sits on a white disc
                // instead of being drawn green on white. Same green, so this
                // introduces no new colour.
                <View style={styles.checkDisc}>
                  <Icon name="check" size={12} color={VERIFIED_GREEN} />
                </View>
              ) : null}
            </View>
            <T weight={700} size={11} ls={1.1} color={WHITE_55} numberOfLines={1} style={styles.kindLine}>
              {[identity.kind?.trim() || "Property dealer", identity.city?.trim()]
                .filter(Boolean)
                .join(" · ")
                .toUpperCase()}
            </T>
          </View>
        </View>

        {/* ---- store bar. A cell with nothing behind it is DROPPED and the
             rest split the width; there are no placeholders here. ---- */}
        <View style={styles.storeBar}>
          {[
            {
              key: "listings",
              value: String(audienceListings.length),
              label: audienceListings.length === 1 ? "LISTING" : "LISTINGS",
            },
            ...(range ? [{ key: "range", value: range, label: "PRICE RANGE" }] : []),
            ...(worksIn ? [{ key: "area", value: worksIn, label: "WORKS IN" }] : []),
          ].map((c, i) => (
            <View key={c.key} style={[styles.cellWrap, i > 0 && styles.cellDivider]}>
              <Cell value={c.value} label={c.label} />
            </View>
          ))}
        </View>

        {/* ---- actions ---- */}
        <View style={styles.actions}>
          {owning ? (
            <>
              <Pressable style={[styles.btn, styles.btnSolid]} onPress={() => router.push("/sell")} testID="store-add">
                <T weight={800} size={13} color={colors.ink}>
                  Add a property
                </T>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnOutline]}
                onPress={() => setViewAsBuyer(true)}
                testID="store-view-as-buyer"
              >
                <T weight={800} size={13} color={colors.white}>
                  View as buyer
                </T>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.btn, styles.btnSolid]}
                onPress={() => identity.key !== undefined && toggleSaveSeller(identity.key as any)}
                testID="store-save"
              >
                <T weight={800} size={13} color={colors.ink}>
                  {isSellerSaved(identity.key as any) ? "Saved" : "Save store"}
                </T>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnOutline]} onPress={onShare} testID="store-share-action">
                <T weight={800} size={13} color={colors.white}>
                  Share
                </T>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* ================= BODY ================= */}
      <View style={styles.body}>
        {identity.bio?.trim() ? (
          <T weight={400} size={14} numberOfLines={3} style={styles.bio}>
            {identity.bio.trim()}
          </T>
        ) : null}

        {owning ? (
          <Pressable onPress={() => router.push("/account")} testID="store-edit-identity">
            <T weight={600} size={13} color={colors.muted} style={{ marginTop: 10 }}>
              Edit photo, name, area and bio
            </T>
          </Pressable>
        ) : (
          // The number is NOT on this screen in any form — not masked, not
          // partial, not behind a tap. It unlocks on the listing, through the
          // same inquiry gate /detail already uses.
          <T weight={500} size={12} color={colors.muted} style={{ marginTop: 12, lineHeight: 17 }}>
            The phone number appears once you send an inquiry.
          </T>
        )}

        {/* ---------- INQUIRIES, above the catalogue, owner only ---------- */}
        {owning ? (
          <View style={styles.strip} testID="store-inquiry-strip">
            {storeLeads.length ? (
              <>
                {storeLeads.slice(0, 3).map((lead: any, i: number) => (
                  <View key={lead.id}>
                    {i > 0 ? <View style={threadRowStyles.divider} /> : null}
                    <View style={styles.leadPad}>
                      <ThreadRow
                        lead={lead}
                        meUid={lead.sellerUid}
                        unread={isLeadUnread(lead)}
                        name={lead.buyerName?.trim() || "AASTHI buyer"}
                        onPress={() => router.push(`/thread?id=${lead.id}`)}
                        testID={`store-lead-${lead.id}`}
                      />
                    </View>
                  </View>
                ))}
                {storeLeads.length > 3 ? (
                  <Pressable
                    style={[styles.leadRow, styles.leadDivider, { justifyContent: "center" }]}
                    onPress={() => router.push("/my-enquiries")}
                    testID="store-lead-seeall"
                  >
                    <T weight={700} size={13}>
                      See all {storeLeads.length}
                    </T>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <View style={styles.leadRow}>
                <T weight={500} size={13.5} color={colors.muted} style={{ lineHeight: 19 }}>
                  Add a property and buyers who contact you will show up here first.
                </T>
              </View>
            )}
          </View>
        ) : null}

        {/* ---------- CATALOGUE ---------- */}
        <View style={styles.sectionHead}>
          <T weight={800} size={19} ls={-0.5}>
            All properties
          </T>
          <T weight={600} size={12} color={colors.muted}>
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
                <T weight={700} size={12.5} color={on ? colors.white : colors.ink}>
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
                onManage={owning ? () => router.push(`/edit-listing?id=${l.id}`) : undefined}
                saved={isSaved(l.id)}
                onToggleSave={owning ? undefined : () => toggleSave(l.id)}
                hidden={owning ? Boolean((l as any).hidden) : false}
                sold={owning ? (l as any).saleStatus === "sold" : false}
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
  // ---- header ----
  header: {
    backgroundColor: colors.black,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topRight: { flexDirection: "row", gap: 8 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WHITE_25,
    alignItems: "center",
    justifyContent: "center",
  },
  idRow: { flexDirection: "row", alignItems: "center", gap: 13, marginTop: 18 },
  avatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.white },
  avatarLetter: { alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  checkDisc: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  kindLine: { marginTop: 5 },
  storeBar: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: WHITE_18,
    borderRadius: 18,
    marginTop: 18,
    paddingVertical: 12,
  },
  cellWrap: { flex: 1 },
  cellDivider: { borderLeftWidth: 1, borderLeftColor: WHITE_18 },
  cell: { alignItems: "center", paddingHorizontal: 8 },
  cellLabel: { marginTop: 4, textTransform: "uppercase" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSolid: { backgroundColor: colors.white },
  btnOutline: { borderWidth: 1, borderColor: WHITE_25 },

  // ---- body ----
  body: { paddingHorizontal: 18, paddingTop: 16 },
  bio: { lineHeight: 20, color: "#2f2f2f" },
  strip: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  leadRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  leadDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  leadPad: { paddingHorizontal: 14 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 22,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.soft,
  },
  chipOn: { backgroundColor: colors.black },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginTop: 14,
  },
});
