import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DEFAULT_LOCATION_ID, locationById, LocationOption } from "@/src/data/locations";
import {
  APP_VERSION,
  DEFAULT_SETTINGS,
  Listing,
  NotificationItem,
  Seller,
  Settings,
  USER_SELLER_ID,
} from "@/src/data/seed";
import {
  addBugReport,
  addLead as fsAddLead,
  addListing,
  addMessage,
  createEmailUser,
  deleteAuthUser,
  deleteListing as fsDeleteListing,
  deleteUserData,
  fanOutSellerIdentity,
  getUserDoc,
  markLeadReplied,
  type SellerIdentityFields,
  saveUserDoc,
  seedIfEmpty,
  signInExistingUser,
  signOutUser,
  updateListing as fsUpdateListing,
  uploadImagesIndexed,
  watchAuth,
  watchLeadsForBuyer,
  watchLeadsForSeller,
  watchListings,
  watchNotifications,
  watchSellers,
  watchUserDoc,
} from "@/src/services/db";
import {
  googleSignIn,
  googleSignInWithIdToken,
} from "@/src/services/authProviders";

export type User = {
  name: string;
  phone: string;
  email: string;
  city: string;
  type: string;
  avatar: string;
  verified: boolean;
  premium?: boolean;
  premiumPlan?: string;
  contactViewsRemaining?: number;
  partnerStatus?: string;
  partnerType?: string;
  businessName?: string;
  operatingAreas?: string;
  // Written by /property-partner. Drives the RERA badge on the shop.
  reraId?: string;
  // Epoch ms, written by change-password.tsx via saveUserDoc.
  passwordChangedAt?: number;
  // Shop front. `cover` is the seller's own banner; when absent the shop
  // falls back to their first listing's photo and then to a plain block —
  // never to a stock photograph, which would show a property they do not have.
  cover?: string;
  // Storefront bio. Three lines on the page, then ellipsis.
  bio?: string;
  // Epoch ms of the last time this user opened their inquiry list. The unread
  // dot on the storefront compares each lead's ts against it.
  //
  // It lives on the USER, not the lead, because firestore.rules denies every
  // update to a lead — deliberately, a lead is an immutable record of contact.
  // So "read" cannot be a flag on the lead itself.
  inquiriesSeenAt?: number;
  // Per-THREAD watermark: { [leadId]: epoch ms of the last time this
  // user opened that thread }. Replaces the single number above for
  // everything unread-related. One list-wide watermark marked every
  // thread read the moment you opened any one of them, which is not a
  // thing an inbox may do.
  threadsSeenAt?: Record<string, number>;
  // Epoch ms, written once at profile setup. Absent for every account created
  // before this existed, and "Member since" shows a dash for those rather
  // than inventing a date.
  createdAt?: number;
};

// A blocked seller is identified either by the seeded numeric id or, for a
// private publisher, by uid. Both live in the same users/{uid}.blocked array.
export type BlockKey = number | string;

export type Draft = {
  category: string;
  propertyType: string;
  type: Listing["type"];
  title: string;
  addr: string;
  geo: string;
  price: string;
  areaUnit: string;
  area: string;
  facing: string;
  beds: string;
  baths: string;
  desc: string;
  vastu: string;
  tourLink: string;
  photos: (string | null)[];
  // Parallel to `photos`. Holds the Storage download URL once that slot has
  // uploaded successfully, so a retry after a partial failure re-uploads only
  // the slots that are still null instead of starting again.
  uploaded: (string | null)[];
  img: string;
  g: string[];
};

const PHOTO_LABELS = ["Front view", "Hall", "Kitchen", "Bedroom", "Road view", "Extra"];

// The saved `type` must agree with what /sell/preview shows. It used to be
// `category.startsWith("Rent") ? "Rent" : "Buy"`, which collapsed Open Plot
// and Commercial into "Buy" — so a plot previewed as Plots and was stored,
// filtered and displayed as Buy for the rest of its life. This is the same
// mapping /sell/preview uses, kept in one place so they cannot drift again.
export function listingTypeOf(category: string, propertyType: string): Listing["type"] {
  if (propertyType === "Open Plot") return "Plots";
  if (propertyType === "Commercial") return "Commercial";
  return category.startsWith("Rent") ? "Rent" : "Buy";
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90";
const FALLBACK_G = [
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=88",
];

function freshDraft(): Draft {
  return {
    category: "Sell Property",
    propertyType: "Independent House",
    type: "Buy",
    title: "New independent house listing",
    addr: "Nandyal Road, Kurnool",
    geo: "15.8281, 78.0373",
    price: "₹86,00,000",
    areaUnit: "Square Feet",
    // Bare number: the unit picker in app/sell/details.tsx appends the suffix.
    area: "2,240",
    facing: "East",
    beds: "-",
    baths: "-",
    desc: "East-facing independent house with wide road access, premium interiors and clear documents.",
    vastu: "Entrance east-facing. Kitchen southeast. Puja room northeast.",
    tourLink: "https://youtube.com/360-tour-demo",
    photos: [null, null, null, null, null, null],
    uploaded: [null, null, null, null, null, null],
    img: FALLBACK_IMG,
    g: FALLBACK_G,
  };
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

type Ctx = {
  booted: boolean;
  authed: boolean;
  user: User;
  selectedLocation: LocationOption;
  setSelectedLocation: (location: LocationOption) => void;
  sellers: Seller[];
  listings: Listing[];
  saved: string[];
  settings: Settings;
  draft: Draft;
  notifications: NotificationItem[];
  blocked: BlockKey[];
  // Listings with blocked sellers removed — what Home, Search and Saved show.
  browseListings: Listing[];
  blockKeyOfListing: (l: any) => BlockKey;
  isBlockedKey: (key: BlockKey | undefined) => boolean;
  toast: string | null;
  photoLabels: string[];
  version: string;
  // Seller-side
  myListings: Listing[];
  myLeads: any[];
  // Buyer-side: leads THIS user sent. Readable under the deployed rules
  // (leads: buyerUid == request.auth.uid).
  mySentLeads: any[];
  enquiryCountFor: (listingId: string) => number;
  contactedListingIds: string[];
  updateMyListing: (listingId: string, data: Record<string, any>) => Promise<void>;
  deleteMyListing: (listingId: string) => Promise<void>;
  setListingHidden: (listingId: string, hidden: boolean) => Promise<void>;
  setListingSaleStatus: (listingId: string, s: "live" | "token" | "sold") => Promise<void>;
  unreadLeadCount: number;
  isLeadUnread: (lead: any) => boolean;
  // Unread because a MESSAGE arrived. Used on the Sent side, where the
  // inquiry itself was the user's own action.
  isThreadUnread: (leadId: string) => boolean;
  markInquiriesSeen: () => void;
  markReplied: (leadId: string) => void;
  // One inquiry thread, from either side.
  leadById: (leadId: string) => any | null;
  sendMessage: (leadId: string, text: string) => Promise<void>;
  markThreadSeen: (leadId: string) => void;
  savedSellers: BlockKey[];
  isSellerSaved: (key: BlockKey | undefined) => boolean;
  toggleSaveSeller: (key: BlockKey) => void;

  showToast: (m: string) => void;
  login: (email: string, password: string) => Promise<{ needsSetup: boolean }>;
  signup: (email: string, password: string) => Promise<{ needsSetup: boolean }>;
  loginWithGoogle: () => Promise<{ needsSetup: boolean }>;
  loginWithGoogleIdToken: (idToken: string) => Promise<{ needsSetup: boolean }>;
  completeProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  savedListings: () => Listing[];
  listingsBySeller: (sellerId: number) => Listing[];
  // Null when the listing has no sellerUid and its numeric `seller` matches
  // nothing. Callers render the seller block not at all rather than blank.
  sellerOf: (l: Listing) => Seller | null;
  updateAccount: (data: Partial<User>) => Promise<void>;
  setSetting: (k: keyof Settings, v: boolean | string) => void;
  setDraft: (patch: Partial<Draft>) => void;
  setPhoto: (i: number, uri: string | null) => void;
  resetDraft: () => void;
  publishListing: () => Promise<void>;
  addLead: (
    listingId: string,
    sellerId: number,
    type: "enquiry" | "contact" | "visit",
    message?: string,
  ) => Promise<void>;
  submitBug: (category: string, desc: string) => Promise<string>;
  toggleBlock: (key: BlockKey) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  // Whether the signed-in user's profile document has arrived yet. Gates the
  // splash so the router cannot decide before it knows. See `booted` below.
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // Leads where I am the seller (My enquiries) and where I am the buyer
  // (used only to decide whether I have earned a seller's number).
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [myBuyerLeads, setMyBuyerLeads] = useState<any[]>([]);
  const [draft, setDraftState] = useState<Draft>(freshDraft());
  const [toast, setToast] = useState<string | null>(null);
  const [selectedLocationState, setSelectedLocationState] = useState<LocationOption>(() => locationById(DEFAULT_LOCATION_ID));

  useEffect(() => {
    AsyncStorage.getItem("selected-location-id")
      .then((id) => {
        if (id) setSelectedLocationState(locationById(id));
      })
      .catch(() => {});
  }, []);
  // Boot: seed + subscribe to data + auth
  useEffect(() => {
    let unsubSellers: (() => void) | undefined;
    let unsubListings: (() => void) | undefined;
    (async () => {
      try {
        await seedIfEmpty();
      } catch (e) {
        // seeding may fail if rules deny; data subscription still attempted
        console.log("seed error", e);
      }
      unsubSellers = watchSellers(setSellers);
      unsubListings = watchListings((ls) => setListings(ls as Listing[]));
    })();
    const unsubAuth = watchAuth((fu) => {
      setUid(fu?.uid ?? null);
      setAuthReady(true);
    });
    return () => {
      unsubAuth();
      unsubSellers?.();
      unsubListings?.();
    };
  }, []);

  // Profile + notifications per user
  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setNotifications([]);
      setMyLeads([]);
      setMyBuyerLeads([]);
      // Nothing to wait for: a signed-out app is fully booted.
      setProfileLoaded(true);
      return;
    }
    // A restored session arrives BEFORE its users/{uid} document does. Until
    // that document lands we do not yet know whether this user is set up, so
    // the app must keep showing the splash rather than guess. Guessing was
    // the bug: index.tsx read `authed` the instant auth was ready, saw a
    // null profile, and redirected to the login screen — permanently, since
    // <Redirect> fires once. A user with a perfectly valid restored session
    // was told to sign in again.
    setProfileLoaded(false);
    const unsubUser = watchUserDoc(uid, (p) => {
      setProfile(p);
      setProfileLoaded(true);
    });
    const unsubNotif = watchNotifications(uid, (items) => setNotifications(items as NotificationItem[]));
    // Both lead listeners fail closed to [] if the deployed rules have not
    // been updated yet (see firebase/firestore.rules), so a stale ruleset
    // shows an empty enquiry list rather than crashing the app.
    const unsubSellerLeads = watchLeadsForSeller(uid, setMyLeads);
    const unsubBuyerLeads = watchLeadsForBuyer(uid, setMyBuyerLeads);
    return () => {
      unsubUser();
      unsubNotif();
      unsubSellerLeads();
      unsubBuyerLeads();
    };
  }, [uid]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // "Booted" now means we know BOTH whether someone is signed in AND, if so,
  // what their profile says. Without the second half the router decides too
  // early and bounces a restored session to the login screen.
  const booted = authReady && (!uid || profileLoaded);
  const authed = authReady && !!uid && !!profile?.setup;

  const user: User = useMemo(
    () => ({
      name: profile?.name ?? "",
      // NO FALLBACK. The old default "+91 90000 12345" made every user look
      // as though they had saved a number they had never entered, and that
      // fake number is now what a buyer would be shown after enquiring.
      // An empty phone must read as empty.
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      city: profile?.city ?? "Kurnool, Andhra Pradesh",
      type: profile?.type ?? "AASTHI member",
      avatar: profile?.avatar ?? DEFAULT_AVATAR,
      verified: profile?.verified ?? false,
      premium: profile?.premium ?? false,
      premiumPlan: profile?.premiumPlan ?? "Free",
      contactViewsRemaining: profile?.contactViewsRemaining ?? 2,
      partnerStatus: profile?.partnerStatus ?? "none",
      partnerType: profile?.partnerType ?? "",
      businessName: profile?.businessName ?? "",
      operatingAreas: profile?.operatingAreas ?? "",
      reraId: profile?.reraId ?? "",
      // No default: privacy.tsx distinguishes "never changed" from a real
      // timestamp, so this must stay undefined until the doc actually has it.
      passwordChangedAt: profile?.passwordChangedAt,
      cover: profile?.cover,
      bio: profile?.bio ?? "",
      inquiriesSeenAt: profile?.inquiriesSeenAt,
      threadsSeenAt: profile?.threadsSeenAt,
      createdAt: profile?.createdAt,
    }),
    [profile],
  );

  const saved: string[] = useMemo(() => profile?.saved ?? [], [profile]);
  const settings: Settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...(profile?.settings ?? {}) }),
    [profile],
  );
  // `blocked` now holds BOTH kinds of key: the seeded sellers' numeric ids
  // (which is all it ever held) and the uids of private publishers, who
  // could not be blocked at all before. Existing documents keep working
  // untouched — a number[] is a valid BlockKey[].
  const blocked: BlockKey[] = useMemo(() => profile?.blocked ?? [], [profile]);

  // The key that identifies a listing's owner for blocking. A private
  // publisher is keyed by uid; a seeded seller by its numeric id.
  const blockKeyOfListing = useCallback((l: any): BlockKey => l?.sellerUid ?? l?.seller, []);

  const isBlockedKey = useCallback(
    (key: BlockKey | undefined) => key !== undefined && key !== null && blocked.includes(key),
    [blocked],
  );

  // Listings with blocked sellers removed. This is what Home, Search and
  // Saved render. `listings` stays unfiltered so a direct /detail?id= link
  // still resolves and so /blocked can find a blocked seller's properties.
  // Home and Search show only what a buyer can still act on: blocked sellers
  // removed, and SOLD properties removed. A sold listing is not deleted — it
  // stays on its seller's shop under Sold, because a track record is the
  // point of having a shop. "token" stays visible: money has moved but the
  // sale is not done.
  const browseListings = useMemo(
    () =>
      listings.filter(
        (l) =>
          !isBlockedKey(blockKeyOfListing(l)) &&
          ((l as any).saleStatus ?? "live") !== "sold" &&
          // Hidden is the owner's own switch. It hides from everyone else;
          // the owner still sees it on their storefront under Hidden.
          !(l as any).hidden,
      ),
    [listings, isBlockedKey, blockKeyOfListing],
  );

  useEffect(() => {
    const id = profile?.selectedLocationId;
    if (id) setSelectedLocationState(locationById(id));
  }, [profile?.selectedLocationId]);

  const setSelectedLocation = useCallback(
    (location: LocationOption) => {
      setSelectedLocationState(location);
      AsyncStorage.setItem("selected-location-id", location.id).catch(() => {});
      if (uid) saveUserDoc(uid, { selectedLocationId: location.id, city: `${location.name}, ${location.state}` }).catch(() => {});
    },
    [uid],
  );
  // ---- Auth ----
  const login = useCallback(async (email: string, password: string) => {
    const fu = await signInExistingUser(email.trim(), password);
    const existing = await getUserDoc(fu.uid);
    return { needsSetup: !existing?.setup };
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const fu = await createEmailUser(email.trim(), password);
    const existing = await getUserDoc(fu.uid);
    return { needsSetup: !existing?.setup };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const fu = await googleSignIn();
    const existing = await getUserDoc(fu.uid);
    return { needsSetup: !existing?.setup };
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const fu = await googleSignInWithIdToken(idToken);
    const existing = await getUserDoc(fu.uid);
    return { needsSetup: !existing?.setup };
  }, []);

  const completeProfile = useCallback(
    async (data: Partial<User>) => {
      if (!uid) return;
      // createdAt drives "Member since" on the shop. Written once, here.
      await saveUserDoc(uid, { ...data, setup: true, verified: false, createdAt: Date.now() });
    },
    [uid],
  );

  const logout = useCallback(async () => {
    await signOutUser();
  }, []);

  const deleteAccount = useCallback(async () => {
    if (uid) await deleteUserData(uid);
    await deleteAuthUser().catch(() => {});
  }, [uid]);

  // ---- Saved ----
  const toggleSave = useCallback(
    (id: string) => {
      if (!uid) {
        showToast("Sign in to save properties");
        return;
      }
      const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
      saveUserDoc(uid, { saved: next });
    },
    [uid, saved, showToast],
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  // Resolves BOTH kinds of seller:
  //   - a seeded seller, matched on the numeric `seller` field
  //   - a real publisher, built from the identity fields denormalised onto
  //     the listing at publish time. It has to come off the listing:
  //     firestore.rules:32 restricts users/{uid} to its owner, so there is no
  //     way to read another publisher's profile document at render time.
  const sellerOf = useCallback(
    (l: Listing): Seller | null => {
      const anyL = l as any;
      if (anyL?.sellerUid && (anyL.sellerName || anyL.seller === USER_SELLER_ID)) {
        return {
          id: USER_SELLER_ID,
          uid: anyL.sellerUid,
          name: anyL.sellerName || "AASTHI member",
          // The city, and only the city. It used to be `sellerCity ||
          // "Private seller"`, which put the word "Private seller" into the
          // slot every screen reads as a location — and `trust` below already
          // says exactly that, two lines away.
          city: anyL.sellerCity || "",
          trust: "Private seller",
          // The listing carries the publisher's verified flag; this was
          // hardcoded false, so an agent AASTHI had actually verified showed
          // as unverified on /detail while the seeded companies showed a
          // check they were simply given in seed data.
          verified: Boolean(anyL.sellerVerified),
          img: anyL.sellerAvatar || DEFAULT_AVATAR,
          cover: anyL.img || FALLBACK_IMG,
          phone: anyL.sellerPhone || "",
        };
      }
      // NULL when the seller cannot be resolved, and callers render nothing.
      //
      // This used to end `?? sellers[0] ?? ({} as Seller)`. Both fallbacks
      // were wrong in different ways. `sellers[0]` attributed an orphaned
      // listing to whichever seeded company happened to sort first —
      // "Sri Homes Realty" — on a property they have never seen. The empty
      // object was worse: it satisfied the type and then rendered an
      // undefined name, an <Image> with an undefined uri, a TrustTag with an
      // undefined label and a link to /seller?id=undefined.
      //
      // Unresolvable means exactly one thing: the listing has no sellerUid
      // AND its numeric `seller` matches nothing in the sellers collection.
      return sellers.find((s) => s.id === l.seller) ?? null;
    },
    [sellers],
  );

  // Saved respects blocking too — a shortlisted property from a seller you
  // later blocked should not keep appearing.
  const savedListings = useCallback(
    () => saved.map((id) => browseListings.find((l) => l.id === id)).filter(Boolean) as Listing[],
    [saved, browseListings],
  );

  const listingsBySeller = useCallback(
    (sellerId: number) => listings.filter((l) => l.seller === sellerId),
    [listings],
  );

  // Identity as it should appear on every listing this user owns.
  const identityFields = useCallback(
    (u: User): SellerIdentityFields => ({
      sellerName: u.name ?? "",
      sellerAvatar: u.avatar ?? "",
      sellerCity: u.city ?? "",
      sellerPhone: (u.phone ?? "").trim(),
      sellerBio: u.bio ?? "",
      sellerArea: u.operatingAreas ?? "",
      sellerVerified: Boolean(u.verified),
    }),
    [],
  );

  const updateAccount = useCallback(
    async (data: Partial<User>) => {
      if (!uid) return;
      await saveUserDoc(uid, data);
      // FAN OUT. Without this, editing your bio leaves every existing listing
      // carrying the old one, and the storefront renders whichever copy its
      // newest listing happens to hold. Failure here must not fail the save —
      // the user document is the source of truth and the backfill script can
      // repair the copies.
      try {
        await fanOutSellerIdentity(uid, identityFields({ ...user, ...data } as User));
      } catch {
        showToast("Saved. Your listings will update shortly.");
      }
    },
    [uid, user, identityFields, showToast],
  );

  // Self-heal for the one identity change that does NOT come through
  // /account: `verified` is set server-side by the admin Cloud Function when
  // it approves a verification, so no client save ever fires for it. If the
  // listings disagree with the user document, fix them once.
  const healedRef = useRef(false);
  useEffect(() => {
    if (!uid || healedRef.current) return;
    // Read off `listings` directly: myListings is declared further down and
    // referencing it here would be a use-before-declaration.
    const mine = listings.filter((l: any) => l.sellerUid === uid);
    if (!mine.length) return;
    const stale = mine.some((l: any) => Boolean(l.sellerVerified) !== Boolean(user.verified));
    if (!stale) return;
    healedRef.current = true;
    fanOutSellerIdentity(uid, identityFields(user)).catch(() => {
      healedRef.current = false;
    });
  }, [uid, listings, user, identityFields]);

  const setSetting = useCallback(
    (k: keyof Settings, v: boolean | string) => {
      if (!uid) return;
      saveUserDoc(uid, { settings: { ...settings, [k]: v } });
    },
    [uid, settings],
  );

  const setDraft = useCallback((patch: Partial<Draft>) => {
    setDraftState((p) => ({ ...p, ...patch }));
  }, []);

  const setPhoto = useCallback((i: number, uri: string | null) => {
    setDraftState((p) => {
      const photos = [...p.photos];
      photos[i] = uri;
      // Changing or clearing a slot invalidates whatever was uploaded for it,
      // otherwise a swapped photo would publish the previous image's URL.
      const uploaded = [...p.uploaded];
      uploaded[i] = null;
      return { ...p, photos, uploaded };
    });
  }, []);

  const resetDraft = useCallback(() => setDraftState(freshDraft()), []);

  const publishListing = useCallback(async () => {
    if (!uid) return;
    // A listing must carry a reachable seller. Without a number the "Contact
    // number" promise on /detail cannot be kept, so publishing is refused
    // here and /sell/preview routes the user to /account to add one.
    if (!user.phone.trim()) {
      const err: any = new Error("Add your phone number before publishing");
      err.code = "no-phone";
      throw err;
    }
    // ---- Photos: a failed upload now FAILS THE PUBLISH ----
    // This used to be a try/catch whose body was console.log, so a listing
    // whose photos never uploaded was published anyway carrying the stock
    // FALLBACK_IMG / FALLBACK_G Unsplash photographs under the publisher's
    // own name. That is the single worst thing this app did.
    const slots = draft.photos
      .map((uri, index) => ({ index, uri }))
      .filter((s) => Boolean(s.uri)) as { index: number; uri: string }[];

    if (!slots.length) {
      const err: any = new Error("Add at least one photo before publishing");
      err.code = "no-photos";
      throw err;
    }

    // Only the slots that have not already uploaded. After a partial failure
    // the successful ones are held in draft.uploaded and are not re-sent.
    const pending = slots.filter((s) => !draft.uploaded[s.index]);
    let uploadedMap = [...draft.uploaded];

    if (pending.length) {
      const outcomes = await uploadImagesIndexed(pending, `listings/${uid}`);
      outcomes.forEach((o) => {
        if (o.url) uploadedMap[o.index] = o.url;
      });
      // Persist the partial success immediately, so a retry skips these even
      // if the throw below unwinds the rest of publish.
      setDraftState((p) => ({ ...p, uploaded: uploadedMap }));

      const failed = outcomes.filter((o) => !o.url);
      if (failed.length) {
        const err: any = new Error("Some photos did not upload");
        err.code = "upload-failed";
        err.failedIndexes = failed.map((f) => f.index);
        err.failedLabels = failed.map((f) => PHOTO_LABELS[f.index] ?? `Photo ${f.index + 1}`);
        err.uploadedCount = slots.length - failed.length;
        err.totalCount = slots.length;
        throw err;
      }
    }

    // In slot order, so "Front view" stays the cover.
    const urls = slots
      .map((s) => uploadedMap[s.index])
      .filter(Boolean) as string[];

    if (urls.length !== slots.length) {
      const err: any = new Error("Some photos did not upload");
      err.code = "upload-failed";
      err.failedIndexes = slots.filter((s) => !uploadedMap[s.index]).map((s) => s.index);
      err.failedLabels = slots
        .filter((s) => !uploadedMap[s.index])
        .map((s) => PHOTO_LABELS[s.index] ?? `Photo ${s.index + 1}`);
      err.uploadedCount = urls.length;
      err.totalCount = slots.length;
      throw err;
    }

    await addListing({
      type: listingTypeOf(draft.category, draft.propertyType),
      price: draft.price,
      title: draft.title,
      addr: draft.addr,
      beds: draft.beds,
      baths: draft.baths,
      area: draft.area,
      facing: draft.facing,
      dist: "1.0 km",
      // USER_SELLER_ID, not 0. `seller: 0` attributed every user's property
      // to the seeded company "Sri Homes Realty".
      seller: USER_SELLER_ID,
      // No FALLBACK_IMG / FALLBACK_G fallback any more. Reaching this line
      // means every photo the seller chose is in Storage.
      //
      // `g` holds the photos AFTER the cover, never the cover itself. It used
      // to be the whole array while `img` was also urls[0], and /detail and
      // /gallery both build [img, ...g] — so every user listing showed its
      // cover twice and reported one photo too many. Seeded listings always
      // followed this convention; publishing did not.
      img: urls[0],
      g: urls.slice(1),
      desc: draft.desc,
      tourLink: draft.tourLink,
      propertyType: draft.propertyType,
      vastu: draft.vastu,
      // Denormalised publisher identity — see sellerOf for why.
      saleStatus: "live",
      views: 0,
      sellerUid: uid,
      sellerName: user.name,
      sellerAvatar: user.avatar,
      sellerCity: user.city,
      sellerPhone: user.phone.trim(),
      // The storefront's identity block needs these, and a buyer cannot read
      // another agent's users/{uid} document — firestore.rules restricts it to
      // its owner. Same denormalisation reason as sellerName above.
      sellerBio: user.bio ?? "",
      sellerArea: user.operatingAreas ?? "",
      sellerVerified: Boolean(user.verified),
    });
    resetDraft();
  }, [uid, draft, resetDraft, user]);

  const addLead = useCallback(
    async (
      listingId: string,
      sellerId: number,
      type: "enquiry" | "contact" | "visit",
      message?: string,
    ) => {
      if (!uid) return;
      // Carry the listing's owner uid and enough context for the seller's
      // notification and the My enquiries row. Same undefined discipline as
      // `message`: Firestore is initialised without
      // ignoreUndefinedProperties, so every optional key is spread in only
      // when it actually has a value.
      const listing = listings.find((l) => l.id === listingId) as any;
      const sellerUid: string | undefined = listing?.sellerUid;
      const listingTitle: string | undefined = listing?.title;
      const sellerName: string | undefined = listing
        ? sellerOf(listing)?.name
        : undefined;
      // Omit `message` entirely when the caller passes nothing. Firestore is
      // initialised without ignoreUndefinedProperties, so spreading
      // `message: undefined` would make addDoc throw on contact.tsx, which
      // calls this with three arguments. An empty string is a deliberate
      // value and is kept.
      // Was `.catch(() => {})`. A lead that failed to write still showed the
      // buyer "Enquiry Sent", which is the worst possible outcome on the one
      // path this whole app exists for. The promise is returned so callers
      // can refuse to navigate to the confirmation until the write lands.
      return fsAddLead({
        listingId,
        sellerId,
        buyerUid: uid,
        type,
        ...(message !== undefined ? { message } : {}),
        ...(sellerUid ? { sellerUid } : {}),
        ...(listingTitle ? { listingTitle } : {}),
        ...(user.name ? { buyerName: user.name } : {}),
        // So a Sent row can name who was contacted once the listing is gone.
        ...(sellerName ? { sellerName } : {}),
        // The buyer's number, and ONLY when they have left "Show contact to
        // sellers" on. That toggle has been in Privacy since launch, its own
        // label says "Phone number visible after enquiry", and nothing read
        // it until now. Turning it off means the seller gets no number and
        // cannot call back — which is the point of the switch.
        ...(settings.showContact && user.phone.trim()
          ? { buyerPhone: user.phone.trim() }
          : {}),
      });
    },
    [uid, listings, user.name, user.phone, settings.showContact, sellerOf],
  );

  // Stamps that the agent responded to a lead. Writes to leadReplies/{leadId},
  // never to the lead, which stays immutable by rule.
  const markReplied = useCallback(
    (leadId: string) => {
      if (!uid || !leadId) return;
      markLeadReplied(leadId, uid).catch(() => {});
    },
    [uid],
  );

  // ---- Seller-side: my listings, my enquiries ----
  const myListings = useMemo(
    () => (uid ? listings.filter((l) => (l as any).sellerUid === uid) : []),
    [listings, uid],
  );

  const updateMyListing = useCallback(
    async (listingId: string, data: Record<string, any>) => {
      await fsUpdateListing(listingId, data);
    },
    [],
  );

  const deleteMyListing = useCallback(async (listingId: string) => {
    await fsDeleteListing(listingId);
  }, []);

  // Storefront owner-bar actions. Thin wrappers so the screen never has to
  // know the field names.
  const setListingHidden = useCallback(
    async (listingId: string, hidden: boolean) => {
      await fsUpdateListing(listingId, { hidden });
    },
    [],
  );

  const setListingSaleStatus = useCallback(
    async (listingId: string, saleStatus: "live" | "token" | "sold") => {
      await fsUpdateListing(listingId, { saleStatus });
    },
    [],
  );

  // Unread, PER THREAD. A lead cannot carry a read flag — firestore.rules
  // denies every lead update on purpose — so the watermark lives on the user
  // document, now as a map keyed by lead id rather than one number for the
  // whole list.
  //
  // A thread is unread when either the original inquiry, or a message in it,
  // is newer than the last time this user opened THAT thread. The message
  // side is read off `notifications`, which the app already subscribes to and
  // which now carries `leadId` on every message notification. That avoids
  // subscribing to every thread just to render a dot on a list.
  const threadsSeenAt = useMemo(() => user.threadsSeenAt ?? {}, [user.threadsSeenAt]);

  const lastMessageAtByLead = useMemo(() => {
    const out: Record<string, number> = {};
    for (const n of notifications as any[]) {
      if (!n?.leadId) continue;
      const ms = (n.ts?.seconds ?? 0) * 1000;
      if (ms > (out[n.leadId] ?? 0)) out[n.leadId] = ms;
    }
    return out;
  }, [notifications]);

  const isLeadUnread = useCallback(
    (lead: any) => {
      if (!lead?.id) return false;
      // Legacy fallback: accounts that only ever had the old list-wide
      // watermark keep it as the floor, so nothing that was already read
      // lights up again after the upgrade.
      const seen = threadsSeenAt[lead.id] ?? user.inquiriesSeenAt ?? 0;
      const newest = Math.max((lead.ts?.seconds ?? 0) * 1000, lastMessageAtByLead[lead.id] ?? 0);
      return newest > seen;
    },
    [threadsSeenAt, user.inquiriesSeenAt, lastMessageAtByLead],
  );

  // Message-only unread, for a lead I SENT. The inquiry itself is my own
  // doing, so it must not mark my own Sent row unread the moment I send it —
  // only a reply counts there.
  const isThreadUnread = useCallback(
    (leadId: string) => {
      if (!leadId) return false;
      const seen = threadsSeenAt[leadId] ?? user.inquiriesSeenAt ?? 0;
      return (lastMessageAtByLead[leadId] ?? 0) > seen;
    },
    [threadsSeenAt, user.inquiriesSeenAt, lastMessageAtByLead],
  );

  // BOTH sides, de-duplicated. A lead where the same account is buyer and
  // seller — which is exactly the case while testing with one login —
  // appears in both lists and must count once.
  const unreadLeadCount = useMemo(() => {
    const ids = new Set<string>();
    (myLeads as any[]).forEach((l) => {
      if (isLeadUnread(l)) ids.add(l.id);
    });
    (myBuyerLeads as any[]).forEach((l) => {
      if (isThreadUnread(l.id)) ids.add(l.id);
    });
    return ids.size;
  }, [myLeads, myBuyerLeads, isLeadUnread, isThreadUnread]);

  const leadById = useCallback(
    (leadId: string) =>
      (myLeads as any[]).find((l) => l.id === leadId) ??
      // myBuyerLeads, not mySentLeads: same documents, but the sorted
      // `mySentLeads` is declared further down the file.
      (myBuyerLeads as any[]).find((l) => l.id === leadId) ??
      null,
    [myLeads, myBuyerLeads],
  );

  const markThreadSeen = useCallback(
    (leadId: string) => {
      if (!uid || !leadId) return;
      saveUserDoc(uid, { threadsSeenAt: { ...threadsSeenAt, [leadId]: Date.now() } }).catch(() => {});
    },
    [uid, threadsSeenAt],
  );

  // The other party on a lead, which is who gets the notification.
  const sendMessage = useCallback(
    async (leadId: string, text: string) => {
      if (!uid) return;
      const lead = leadById(leadId);
      const recipientUid = lead?.sellerUid === uid ? lead?.buyerUid : lead?.sellerUid;
      await addMessage({
        leadId,
        senderUid: uid,
        text,
        ...(recipientUid ? { recipientUid } : {}),
        ...(user.name ? { senderName: user.name } : {}),
        ...(lead?.listingTitle ? { listingTitle: lead.listingTitle } : {}),
      });
    },
    [uid, leadById, user.name],
  );

  // Saved STORES, distinct from saved listings. The storefront's buyer-side
  // "Save" needs somewhere real to write; without this it would be a control
  // that does nothing, which is what half of this app used to be.
  const savedSellers: BlockKey[] = useMemo(() => profile?.savedSellers ?? [], [profile]);

  const isSellerSaved = useCallback(
    (key: BlockKey | undefined) => key !== undefined && savedSellers.includes(key),
    [savedSellers],
  );

  const toggleSaveSeller = useCallback(
    (key: BlockKey) => {
      if (!uid) {
        showToast("Sign in to save a store");
        return;
      }
      const next = savedSellers.includes(key)
        ? savedSellers.filter((k) => k !== key)
        : [...savedSellers, key];
      saveUserDoc(uid, { savedSellers: next }).catch(() => {});
    },
    [uid, savedSellers, showToast],
  );

  const markInquiriesSeen = useCallback(() => {
    if (!uid) return;
    saveUserDoc(uid, { inquiriesSeenAt: Date.now() }).catch(() => {});
  }, [uid]);

  // Listings this buyer has already enquired/contacted/visited on. Drives the
  // number reveal on /detail.
  const contactedListingIds = useMemo(
    () => Array.from(new Set(myBuyerLeads.map((l: any) => l.listingId).filter(Boolean))),
    [myBuyerLeads],
  );

  // Same data as contactedListingIds is derived from, but ordered for
  // display. watchLeadsForBuyer does not sort (it only feeds a set), so the
  // ordering happens here.
  // Enquiries per listing, for the OWNER only. Derived from the leads this
  // user can already read as a seller — no extra Firestore read, and a buyer
  // can never compute it because they cannot read another seller's leads.
  const enquiryCountFor = useCallback(
    (listingId: string) => myLeads.filter((l: any) => l.listingId === listingId).length,
    [myLeads],
  );

  const mySentLeads = useMemo(
    () =>
      [...myBuyerLeads].sort(
        (a: any, b: any) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0),
      ),
    [myBuyerLeads],
  );

  const submitBug = useCallback(
    async (category: string, desc: string) => {
      return addBugReport({ category, desc, uid: uid ?? "anon", appVersion: APP_VERSION });
    },
    [uid],
  );

  const toggleBlock = useCallback(
    (key: BlockKey) => {
      if (!uid) return;
      const next = blocked.includes(key)
        ? blocked.filter((x) => x !== key)
        : [...blocked, key];
      saveUserDoc(uid, { blocked: next });
    },
    [uid, blocked],
  );

  const value = useMemo<Ctx>(
    () => ({
      booted,
      authed,
      user,
      selectedLocation: selectedLocationState,
      setSelectedLocation,
      sellers,
      listings,
      saved,
      settings,
      draft,
      notifications,
      blocked,
      browseListings,
      blockKeyOfListing,
      isBlockedKey,
      toast,
      photoLabels: PHOTO_LABELS,
      version: APP_VERSION,
      myListings,
      myLeads,
      mySentLeads,
      enquiryCountFor,
      contactedListingIds,
      updateMyListing,
      deleteMyListing,
      setListingHidden,
      setListingSaleStatus,
      unreadLeadCount,
      isLeadUnread,
      isThreadUnread,
      markInquiriesSeen,
      markReplied,
      leadById,
      sendMessage,
      markThreadSeen,
      savedSellers,
      isSellerSaved,
      toggleSaveSeller,
      showToast,
      login,
      signup,
      loginWithGoogle,
      loginWithGoogleIdToken,
      completeProfile,
      logout,
      deleteAccount,
      toggleSave,
      isSaved,
      savedListings,
      listingsBySeller,
      sellerOf,
      updateAccount,
      setSetting,
      setDraft,
      setPhoto,
      resetDraft,
      publishListing,
      addLead,
      submitBug,
      toggleBlock,
    }),
    [
      booted,
      authed,
      user,
      selectedLocationState,
      setSelectedLocation,
      sellers,
      listings,
      saved,
      settings,
      draft,
      notifications,
      blocked,
      browseListings,
      blockKeyOfListing,
      isBlockedKey,
      toast,
      myListings,
      myLeads,
      mySentLeads,
      enquiryCountFor,
      contactedListingIds,
      updateMyListing,
      deleteMyListing,
      setListingHidden,
      setListingSaleStatus,
      unreadLeadCount,
      isLeadUnread,
      isThreadUnread,
      markInquiriesSeen,
      markReplied,
      leadById,
      sendMessage,
      markThreadSeen,
      savedSellers,
      isSellerSaved,
      toggleSaveSeller,
      showToast,
      login,
      signup,
      loginWithGoogle,
      loginWithGoogleIdToken,
      completeProfile,
      logout,
      deleteAccount,
      toggleSave,
      isSaved,
      savedListings,
      listingsBySeller,
      sellerOf,
      updateAccount,
      setSetting,
      setDraft,
      setPhoto,
      resetDraft,
      publishListing,
      addLead,
      submitBug,
      toggleBlock,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

