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
  createEmailUser,
  deleteAuthUser,
  deleteListing as fsDeleteListing,
  deleteUserData,
  getUserDoc,
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
  // Epoch ms, written by change-password.tsx via saveUserDoc.
  passwordChangedAt?: number;
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
  contactedListingIds: string[];
  updateMyListing: (listingId: string, data: Record<string, any>) => Promise<void>;
  deleteMyListing: (listingId: string) => Promise<void>;

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
  sellerOf: (l: Listing) => Seller;
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
      return;
    }
    const unsubUser = watchUserDoc(uid, setProfile);
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

  const booted = authReady;
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
      // No default: privacy.tsx distinguishes "never changed" from a real
      // timestamp, so this must stay undefined until the doc actually has it.
      passwordChangedAt: profile?.passwordChangedAt,
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
  const browseListings = useMemo(
    () => listings.filter((l) => !isBlockedKey(blockKeyOfListing(l))),
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
      await saveUserDoc(uid, { ...data, setup: true, verified: false });
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
    (l: Listing): Seller => {
      const anyL = l as any;
      if (anyL?.sellerUid && (anyL.sellerName || anyL.seller === USER_SELLER_ID)) {
        return {
          id: USER_SELLER_ID,
          uid: anyL.sellerUid,
          name: anyL.sellerName || "AASTHI member",
          meta: anyL.sellerCity || "Private seller",
          trust: "Private seller",
          verified: false,
          img: anyL.sellerAvatar || DEFAULT_AVATAR,
          cover: anyL.img || FALLBACK_IMG,
          sold: 0,
          rating: "-",
          phone: anyL.sellerPhone || "",
        };
      }
      return sellers.find((s) => s.id === l.seller) ?? sellers[0] ?? ({} as Seller);
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

  const updateAccount = useCallback(
    async (data: Partial<User>) => {
      if (!uid) return;
      await saveUserDoc(uid, data);
    },
    [uid],
  );

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
      img: urls[0],
      g: urls,
      desc: draft.desc,
      tourLink: draft.tourLink,
      propertyType: draft.propertyType,
      vastu: draft.vastu,
      // Denormalised publisher identity — see sellerOf for why.
      sellerUid: uid,
      sellerName: user.name,
      sellerAvatar: user.avatar,
      sellerCity: user.city,
      sellerPhone: user.phone.trim(),
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
      });
    },
    [uid, listings, user.name],
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

  // Listings this buyer has already enquired/contacted/visited on. Drives the
  // number reveal on /detail.
  const contactedListingIds = useMemo(
    () => Array.from(new Set(myBuyerLeads.map((l: any) => l.listingId).filter(Boolean))),
    [myBuyerLeads],
  );

  // Same data as contactedListingIds is derived from, but ordered for
  // display. watchLeadsForBuyer does not sort (it only feeds a set), so the
  // ordering happens here.
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
      contactedListingIds,
      updateMyListing,
      deleteMyListing,
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
      contactedListingIds,
      updateMyListing,
      deleteMyListing,
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

