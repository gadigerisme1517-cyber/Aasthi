import { auth } from "@/src/services/firebase";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin`;

async function authed(path: string, opts: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token ?? ""}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err: any = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const adminApi = {
  check: () => authed("/check"),
  overview: () => authed("/overview"),
  verifications: () => authed("/verifications"),
  listings: (status = "pending") => authed(`/listings?status=${status}`),
  bugs: () => authed("/bugs"),
  actVerification: (id: string, action: "approve" | "reject") =>
    authed(`/verifications/${id}/${action}`, { method: "POST" }),
  actListing: (id: string, action: "approve" | "reject") =>
    authed(`/listings/${id}/${action}`, { method: "POST" }),
};
