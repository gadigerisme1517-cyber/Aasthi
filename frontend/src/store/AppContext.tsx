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
} from "@/src/data/seed";
import {
  addBugReport,
  addLead as fsAddLead,
  addListing,
  createEmailUser,
  deleteAuthUser,
  deleteUserData,
  getUserDoc,
  saveUserDoc,
  seedIfEmpty,
  signInExistingUser,
  signOutUser,
  uploadImages,
  watchAuth,
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
  img: string;
  g: string[];
};

const PHOTO_LABELS = ["Front view", "Hall", "Kitchen", "Bedroom", "Road view", "Extra"];

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
  blocked: number[];
  toast: string | null;
  photoLabels: string[];
  version: string;

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
  ) => void;
  submitBug: (category: string, desc: string) => Promise<string>;
  toggleBlock: (sellerId: number) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
      return;
    }
    const unsubUser = watchUserDoc(uid, setProfile);
    const unsubNotif = watchNotifications(uid, (items) => setNotifications(items as NotificationItem[]));
    return () => {
      unsubUser();
      unsubNotif();
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
      phone: profile?.phone ?? "+91 90000 12345",
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
  const blocked: number[] = useMemo(() => profile?.blocked ?? [], [profile]);

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

  const sellerOf = useCallback(
    (l: Listing) => sellers.find((s) => s.id === l.seller) ?? sellers[0] ?? ({} as Seller),
    [sellers],
  );

  const savedListings = useCallback(
    () => saved.map((id) => listings.find((l) => l.id === id)).filter(Boolean) as Listing[],
    [saved, listings],
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
      return { ...p, photos };
    });
  }, []);

  const resetDraft = useCallback(() => setDraftState(freshDraft()), []);

  const publishListing = useCallback(async () => {
    if (!uid) return;
    const filledUris = draft.photos.filter(Boolean) as string[];
    let urls: string[] = [];
    if (filledUris.length) {
      try {
        urls = await uploadImages(filledUris, `listings/${uid}`);
      } catch (e) {
        console.log("upload error", e);
      }
    }
    await addListing({
      type: draft.category.startsWith("Rent") ? "Rent" : "Buy",
      price: draft.price,
      title: draft.title,
      addr: draft.addr,
      beds: draft.beds,
      baths: draft.baths,
      area: draft.area,
      facing: draft.facing,
      dist: "1.0 km",
      seller: 0,
      img: urls[0] || draft.img,
      g: urls.length ? urls : draft.g,
      desc: draft.desc,
      tourLink: draft.tourLink,
      sellerUid: uid,
    });
    resetDraft();
  }, [uid, draft, resetDraft]);

  const addLead = useCallback(
    (
      listingId: string,
      sellerId: number,
      type: "enquiry" | "contact" | "visit",
      message?: string,
    ) => {
      if (!uid) return;
      // Omit `message` entirely when the caller passes nothing. Firestore is
      // initialised without ignoreUndefinedProperties, so spreading
      // `message: undefined` would make addDoc throw on contact.tsx, which
      // calls this with three arguments. An empty string is a deliberate
      // value and is kept.
      fsAddLead({
        listingId,
        sellerId,
        buyerUid: uid,
        type,
        ...(message !== undefined ? { message } : {}),
      }).catch(() => {});
    },
    [uid],
  );

  const submitBug = useCallback(
    async (category: string, desc: string) => {
      return addBugReport({ category, desc, uid: uid ?? "anon", appVersion: APP_VERSION });
    },
    [uid],
  );

  const toggleBlock = useCallback(
    (sellerId: number) => {
      if (!uid) return;
      const next = blocked.includes(sellerId)
        ? blocked.filter((x) => x !== sellerId)
        : [...blocked, sellerId];
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
      toast,
      photoLabels: PHOTO_LABELS,
      version: APP_VERSION,
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
      toast,
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

