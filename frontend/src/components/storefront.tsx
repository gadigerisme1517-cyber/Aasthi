import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { FeatureCard, type OwnerBar } from "@/src/components/cards";
import { ThreadRow, threadRowStyles } from "@/src/components/thread-row";
import { Button, Empty, PageHead, Screen, T } from "@/src/components/ui";
import { Listing } from "@/src/data/seed";
import { Icon } from "@/src/icons";
import { colors, shadow } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";

// ONE storefront template. There is no second agent page in the app.
//
// The same component renders what a buyer sees and what the agent sees. The
// agent's version ADDS controls — the edit line, the two owner buttons, the
// inquiry strip, the Hidden chip, the per-card owner bar and the gear. It
// never reorders or restyles anything, so an agent checking "View as buyer"
// is looking at the identical screen minus his own controls. That switch is
// local state, not a route.
//
// Inquiries sit ABOVE listings on the agent's version on purpose: he already
// knows what he listed.

const VERIFIED_GREEN = "#12a05e";

export type StorefrontIdentity = {
  key: string | number | undefined; // uid for a real agent, numeric id for a seeded one
  uid?: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  city?: string;
  area?: string;
  bio?: string;
};

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
  const {
    myLeads,
    isLeadUnread,
    isSellerSaved,
    toggleSaveSeller,
    isSaved,
    toggleSave,
    setListingHidden,
    setListingSaleStatus,
    deleteMyListing,
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
  }, [audienceListings, listings, owning]);

  const shown = useMemo(() => {
    if (chip === "Hidden") return listings.filter((l) => (l as any).hidden);
    if (chip === "All") return audienceListings;
    return audienceListings.filter((l) => l.type === chip);
  }, [chip, audienceListings, listings]);

  // Leads for THIS store, newest first. Only ever the agent's own — myLeads is
  // scoped to the signed-in user by the rules.
  const storeLeads = useMemo(() => (isOwner ? myLeads : []), [isOwner, myLeads]);

  // Opening the store no longer marks anything read. Unread is per THREAD
  // now (users.threadsSeenAt), and a screen that showed three of your
  // inquiries had no business declaring all of them seen. Reading happens in
  // app/thread.tsx, one conversation at a time.

  const ownerBarFor = (l: Listing): OwnerBar => ({
    onEdit: () => router.push(`/edit-listing?id=${l.id}`),
    hidden: Boolean((l as any).hidden),
    onToggleHide: async () => {
      const next = !(l as any).hidden;
      await setListingHidden(l.id, next);
      showToast(next ? "Hidden from buyers" : "Visible to buyers again");
    },
    // Delete replaces Mark sold on rentals: a rental is not "sold", and
    // taking it down is what actually happens when it is let.
    ...(l.type === "Rent"
      ? {
          onDelete: async () => {
            await deleteMyListing(l.id);
            showToast("Listing deleted");
          },
        }
      : {
          onMarkSold: async () => {
            await setListingSaleStatus(l.id, "sold");
            showToast("Marked sold");
          },
        }),
  });

  return (
    <Screen
      header={
        <PageHead
          title={owning ? "My store" : "Store"}
          onBack={() => (viewAsBuyer ? setViewAsBuyer(false) : router.back())}
          right={
            // `owning`, not `isOwner`: in buyer preview the gear has to go
            // too. A preview that keeps one owner control is not the screen a
            // buyer sees, which is the only thing the preview is for.
            owning ? (
              <Pressable onPress={() => router.push("/menu")} testID="store-gear" hitSlop={8}>
                <Icon name="gear" size={20} color={colors.ink} />
              </Pressable>
            ) : undefined
          }
        />
      }
    >
      {/* ---------- IDENTITY, identical for both audiences ---------- */}
      <View style={styles.idRow}>
        {identity.avatar ? (
          <Image source={{ uri: identity.avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.soft2 }]} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <T weight={800} size={21} ls={-0.63} numberOfLines={1} style={{ flexShrink: 1 }}>
              {identity.name}
            </T>
            {identity.verified ? (
              <Icon name="check" size={17} color={VERIFIED_GREEN} />
            ) : null}
          </View>
          {/* "City · Works in <area>", either half alone, or the line is not
              rendered at all. It must never fall back to anything else: this
              slot is where a buyer reads where the seller is, and it used to
              receive `meta`, which on a seeded seller was a blurb or an
              invented response rate. */}
          {identity.city || identity.area ? (
            <T weight={500} size={13.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
              {[identity.city, identity.area ? `Works in ${identity.area}` : null]
                .filter(Boolean)
                .join(" · ")}
            </T>
          ) : null}
        </View>
      </View>

      {identity.bio?.trim() ? (
        <T weight={400} size={14} numberOfLines={3} style={styles.bio}>
          {identity.bio.trim()}
        </T>
      ) : null}

      {owning ? (
        <Pressable onPress={() => router.push("/account")} testID="store-edit-identity">
          <T weight={600} size={13} color={colors.muted} style={{ marginTop: 8 }}>
            Edit photo, name, area and bio
          </T>
        </Pressable>
      ) : null}

      {/* Standing row. Only items with real data behind them are rendered —
          see the report: there is no reviews collection and no reply
          timestamp anywhere, so rating and reply time are omitted rather
          than shown as placeholders. */}
      <View style={styles.standing}>
        <Stat value={String(audienceListings.length)} label={audienceListings.length === 1 ? "listing" : "listings"} />
      </View>

      {/* ---------- ACTIONS ---------- */}
      {owning ? (
        <View style={styles.actions}>
          <Button label="Add a property" onPress={() => router.push("/sell")} style={{ flex: 1 }} testID="store-add" />
          <Button
            label="View as buyer"
            variant="light"
            onPress={() => setViewAsBuyer(true)}
            style={{ flex: 1 }}
            testID="store-view-as-buyer"
          />
        </View>
      ) : (
        <>
          {/* No "Send inquiry" here, deliberately. There is no listing on this
              screen for an inquiry to be ABOUT. Pointing it at the newest
              listing would send the agent a lead about a property the buyer
              never opened, and the agent has no way to tell that lead from a
              real one. An inquiry is always raised on a listing, below. */}
          <View style={styles.actions}>
            <Button
              label={isSellerSaved(identity.key as any) ? "Saved" : "Save"}
              variant="light"
              onPress={() => identity.key !== undefined && toggleSaveSeller(identity.key as any)}
              style={{ flex: 1 }}
              testID="store-save"
            />
          </View>
          {/* The number is NOT on this screen in any form — not masked, not
              partial, not behind a tap. It unlocks on the listing, through the
              same inquiry gate /detail already uses. */}
          <T weight={500} size={12} color={colors.muted} style={{ marginTop: 8, lineHeight: 17 }}>
            The phone number appears once you send an inquiry.
          </T>
        </>
      )}

      {/* ---------- INQUIRIES, above the listings, owner only ---------- */}
      {owning ? (
        <View style={styles.strip} testID="store-inquiry-strip">
          {storeLeads.length ? (
            <>
              {/* THE SAME ROW /my-enquiries uses. The strip used to draw its
                  own smaller version of the same idea, which is how two
                  surfaces showing one thing end up looking like two
                  products. */}
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

      {/* ---------- CHIPS ---------- */}
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

      {/* ---------- LISTINGS, the existing card ---------- */}
      {shown.length ? (
        <View style={{ marginTop: 14 }}>
          {shown.map((l) => (
            <FeatureCard
              key={l.id}
              listing={l}
              saved={isSaved(l.id)}
              onToggleSave={owning ? undefined : () => toggleSave(l.id)}
              onPress={() => router.push(`/detail?id=${l.id}`)}
              ownerBar={owning ? ownerBarFor(l) : undefined}
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
    </Screen>
  );
}

// Value and label on ONE line, and the band centres what it holds.
//
// It used to stack the value over the label in a box pinned to the left of a
// full-width band, which was fine while there were three figures and absurd
// once rating and sold were deleted and only the listing count was left: one
// small box against an empty right half. Same reasoning as the count pill on
// the seller cards — a lone stacked box reads as half of a broken pair.
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <T weight={800} size={17}>
        {value}
      </T>
      <T weight={500} size={13} color={colors.muted} style={{ marginLeft: 6 }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  idRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  avatar: { width: 66, height: 66, borderRadius: 22 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bio: { marginTop: 12, lineHeight: 20.3 }, // 14 * 1.45
  standing: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 26,
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  stat: { flexDirection: "row", alignItems: "baseline" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  strip: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: "hidden",
    ...shadow.soft,
  },
  leadRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  // The shared row brings its own vertical rhythm; the strip only supplies
  // the horizontal inset so the hairlines still run the full width of it.
  leadPad: { paddingHorizontal: 14 },
  leadDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: VERIFIED_GREEN },
  dotRead: { backgroundColor: "transparent" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.black, borderColor: colors.black },
});
