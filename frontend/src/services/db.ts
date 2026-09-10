// Firestore + Storage + Auth data layer for AASTHI.
// Collections: sellers, listings, users, leads, notifications, bugReports.
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User as FbUser,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "@/src/services/firebase";
import { LISTINGS, SELLERS, type Listing, type Seller } from "@/src/data/seed";

export type FsSeller = Seller;
export type FsListing = Omit<Listing, "id"> & { id: string; verificationStatus?: string };

// ---------- Auth ----------
export function watchAuth(cb: (u: FbUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signInExistingUser(email: string, password: string): Promise<FbUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function createEmailUser(email: string, password: string): Promise<FbUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerOrSignIn(email: string, password: string): Promise<FbUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e: any) {
    if (e?.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    }
    throw e;
  }
}

export function signOutUser() {
  return signOut(auth);
}

export async function deleteAuthUser() {
  if (auth.currentUser) await deleteUser(auth.currentUser);
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) {
    const err: any = new Error("No email/password account to change");
    err.code = "no-password-account";
    throw err;
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// ---------- Users ----------
export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as any) : null;
}

export function saveUserDoc(uid: string, data: Record<string, any>) {
  return setDoc(doc(db, "users", uid), data, { merge: true });
}

export function watchUserDoc(uid: string, cb: (data: any | null) => void) {
  return onSnapshot(doc(db, "users", uid), (s) => cb(s.exists() ? s.data() : null));
}

export async function deleteUserData(uid: string) {
  const listingsSnap = await getDocs(query(collection(db, "listings"), where("sellerUid", "==", uid)));
  if (!listingsSnap.empty) {
    const batch = writeBatch(db);
    listingsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid));
}

// ---------- Seed ----------
export async function seedIfEmpty() {
  const sellersSnap = await getDocs(collection(db, "sellers"));
  if (!sellersSnap.empty) return;
  const batch = writeBatch(db);
  SELLERS.forEach((s) => {
    batch.set(doc(db, "sellers", `s${s.id}`), s);
  });
  await batch.commit();
  for (const l of LISTINGS) {
    const { id, ...rest } = l;
    await addDoc(collection(db, "listings"), {
      ...rest,
      seedId: id,
      verificationStatus: "verified",
      createdAt: serverTimestamp(),
    });
  }
}

// ---------- Sellers / Listings ----------
export function watchSellers(cb: (sellers: Seller[]) => void) {
  return onSnapshot(collection(db, "sellers"), (snap) => {
    const arr = snap.docs.map((d) => d.data() as Seller).sort((a, b) => a.id - b.id);
    cb(arr);
  });
}

export function watchListings(cb: (listings: FsListing[]) => void) {
  return onSnapshot(collection(db, "listings"), (snap) => {
    const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FsListing[];
    // newest first by createdAt if present
    arr.sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    cb(arr);
  });
}

// Throws on the first failure and loses every upload that already succeeded.
// Kept unchanged because account.tsx, verify.tsx and edit-listing.tsx rely on
// that all-or-nothing behaviour and surface the throw to the user themselves.
export async function uploadImages(uris: string[], folder: string): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    const res = await fetch(uris[i]);
    const blob = await res.blob();
    const r = ref(storage, `${folder}/${Date.now()}_${i}.jpg`);
    await uploadBytes(r, blob);
    urls.push(await getDownloadURL(r));
  }
  return urls;
}

export type UploadOutcome = { index: number; url?: string; error?: string };

// Per-photo outcome instead of all-or-nothing. Never throws: the caller
// decides what a failure means. publishListing uses this so it can (a) refuse
// to publish when any photo failed and (b) keep the ones that succeeded so a
// retry only re-uploads the rest.
export async function uploadImagesIndexed(
  items: { index: number; uri: string }[],
  folder: string,
): Promise<UploadOutcome[]> {
  const out: UploadOutcome[] = [];
  for (const item of items) {
    try {
      const res = await fetch(item.uri);
      if (!res.ok) throw new Error(`could not read the photo (HTTP ${res.status})`);
      const blob = await res.blob();
      const r = ref(storage, `${folder}/${Date.now()}_${item.index}.jpg`);
      await uploadBytes(r, blob);
      out.push({ index: item.index, url: await getDownloadURL(r) });
    } catch (e: any) {
      out.push({ index: item.index, error: e?.code || e?.message || "upload failed" });
    }
  }
  return out;
}

export async function addListing(data: Record<string, any>) {
  const docRef = await addDoc(collection(db, "listings"), {
    ...data,
    verificationStatus: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Owner-scoped edit. firestore.rules:27 already allows update when
// resource.data.sellerUid == request.auth.uid, so no rules change is needed
// for this one.
export function updateListing(listingId: string, data: Record<string, any>) {
  return updateDoc(doc(db, "listings", listingId), data);
}

export function deleteListing(listingId: string) {
  return deleteDoc(doc(db, "listings", listingId));
}

export function boostListing(listingId: string) {
  const expiry = Date.now() + 7 * 24 * 3600 * 1000;
  return updateDoc(doc(db, "listings", listingId), { boosted: true, boostExpiry: expiry });
}

// ---------- Leads / Notifications ----------
const LEAD_NOUN: Record<string, string> = {
  visit: "Visit request",
  contact: "Contact request",
  enquiry: "Enquiry",
};

export async function addLead(payload: {
  listingId: string;
  sellerId: number;
  buyerUid: string;
  type: string;
  message?: string;
  // Optional so existing call sites keep compiling; publishListing-era
  // listings always supply sellerUid, seeded ones cannot.
  sellerUid?: string;
  buyerName?: string;
  listingTitle?: string;
}) {
  await addDoc(collection(db, "leads"), { ...payload, ts: serverTimestamp() });

  // 1. The buyer's own receipt. Unchanged on purpose.
  await addDoc(collection(db, "notifications"), {
    uid: payload.buyerUid,
    title:
      payload.type === "visit"
        ? "Visit requested"
        : payload.type === "contact"
          ? "Contact request sent"
          : "Enquiry sent",
    body: "The seller has been notified and will respond shortly.",
    ts: serverTimestamp(),
  });

  // 2. The seller's notification — the one that never existed. Only possible
  // when the listing carries a sellerUid, i.e. it was published by a real
  // user. Seeded listings have no owner to notify.
  if (payload.sellerUid) {
    const noun = LEAD_NOUN[payload.type] ?? "Enquiry";
    const who = payload.buyerName?.trim() || "A buyer";
    const what = payload.listingTitle?.trim();
    await addDoc(collection(db, "notifications"), {
      uid: payload.sellerUid,
      title: `${noun} received`,
      body: what
        ? `${who} sent a ${noun.toLowerCase()} about "${what}". Open My enquiries to see it.`
        : `${who} sent a ${noun.toLowerCase()} on one of your listings. Open My enquiries to see it.`,
      ts: serverTimestamp(),
    });
  }
}

// Leads addressed to me as the seller. Requires the updated firestore.rules
// (leads: allow read when resource.data.sellerUid == request.auth.uid).
export function watchLeadsForSeller(uid: string, cb: (items: any[]) => void) {
  const qy = query(collection(db, "leads"), where("sellerUid", "==", uid));
  return onSnapshot(
    qy,
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      arr.sort((a: any, b: any) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0));
      cb(arr);
    },
    () => cb([]),
  );
}

// Leads I sent as the buyer. Used only to decide whether this buyer has
// already earned the seller's number on a given listing.
export function watchLeadsForBuyer(uid: string, cb: (items: any[]) => void) {
  const qy = query(collection(db, "leads"), where("buyerUid", "==", uid));
  return onSnapshot(
    qy,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    () => cb([]),
  );
}

export function watchNotifications(uid: string, cb: (items: any[]) => void) {
  const qy = query(collection(db, "notifications"), where("uid", "==", uid));
  return onSnapshot(qy, (snap) => {
    const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    arr.sort((a: any, b: any) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0));
    cb(arr);
  });
}

// ---------- Verification requests ----------
export async function submitVerification(payload: {
  sellerUid: string;
  sellerName: string;
  idDocUrl: string;
  ownershipDocUrl: string;
}) {
  await addDoc(collection(db, "verificationRequests"), {
    ...payload,
    status: "pending",
    ts: serverTimestamp(),
  });
}

export function watchMyVerification(uid: string, cb: (status: string | null) => void) {
  const qy = query(collection(db, "verificationRequests"), where("sellerUid", "==", uid));
  return onSnapshot(qy, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    items.sort((a: any, b: any) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0));
    cb(items[0]?.status ?? null);
  });
}

// ---------- Bug reports ----------
export async function addBugReport(payload: {
  category: string;
  desc: string;
  uid: string;
  appVersion: string;
}) {
  const ticket = `#AH-${1000 + Math.floor(Math.random() * 9000)}`;
  await addDoc(collection(db, "bugReports"), { ...payload, ticket, ts: serverTimestamp() });
  return ticket;
}
