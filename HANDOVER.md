# AASTHI — Handover Report

## Exact project structure (top level)
```
aasthi/
├── CLAUDE.md                 # guide for AI/dev work (architecture, rules)
├── README_LOCAL_SETUP.md     # Windows, non-technical setup
├── HANDOVER.md               # this file
├── .gitignore                # blocks secrets, .env, node_modules, builds
├── frontend/                 # Expo + TypeScript mobile app (+ /admin web)
│   ├── app/                  # Expo Router screens (incl. app/admin/index.tsx)
│   ├── src/                  # theme, icons, data/seed, store, services, components, utils
│   ├── assets/               # fonts (Inter), images
│   ├── package.json, yarn.lock
│   ├── app.json              # Expo config (plugins, permissions, package name)
│   ├── tsconfig.json, metro.config.js, eslint.config.js, expo-env.d.ts
│   └── .env.example          # frontend env (safe public Firebase config)
├── functions/                # FastAPI + Firebase Admin SDK, deployed as api_fn
│   ├── main.py               # app + /api + /api/admin/* routes
│   ├── requirements.txt
│   └── .env.example          # admin API env (secret names only)
├── firebase/
│   ├── firestore.rules       # the LIVE production rules
│   └── storage.rules         # the LIVE production rules
└── scripts/
    └── seed_firestore.py     # seeds the 3 demo sellers + 4 demo listings
```
> Note: `frontend/babel.config.js` is intentionally absent — Expo SDK 54 uses its
> built-in `babel-preset-expo` defaults; no custom Babel config is required.
> `node_modules`, real `.env` files, build outputs and any service-account/
> secret files are deliberately NOT included.

## Start commands
- **Frontend:** `cd frontend && yarn install && npx expo start`  (press `w` for web; Expo Go for phone). Admin panel: web URL + `/admin`.
- **Admin API:** already deployed as the Cloud Function `api_fn` — nothing to run
  locally. Redeploy after editing `functions/`: `firebase deploy --only functions`
- **Seed data:** `cd scripts && GOOGLE_APPLICATION_CREDENTIALS=./service-account.json python seed_firestore.py`

## Required software
Node.js LTS + Yarn, Python 3.11+, (optional) Git, Expo Go app on phone. A
Firebase project (aasthi-3a009) with Authentication (Email/Password + Google),
Firestore, and Storage enabled.

## Required environment variables
**frontend/.env** (EXPO_PUBLIC_* are safe/public):
`EXPO_PUBLIC_BACKEND_URL`, `EXPO_PUBLIC_FIREBASE_API_KEY`,
`EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`,
`EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MSG_SENDER_ID`,
`EXPO_PUBLIC_FIREBASE_APP_ID`, (optional) `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

**functions/.env** (never commit):
`ADMIN_EMAILS` (comma-separated allow-list),
`ADMIN_ALLOWED_ORIGINS` (browser origins for CORS; the Android app needs none).
No service-account key: the deployed function uses its attached service account
via Application Default Credentials.

## Firebase project
- **Project ID:** `aasthi-3a009`
- **Auth domain:** `aasthi-3a009.firebaseapp.com`
- **Storage bucket:** `aasthi-3a009.firebasestorage.app`
- **Enabled:** Email/Password + Google auth, Firestore, Storage.
- **Authorized domains:** `localhost` plus the Firebase-provided
  `aasthi-3a009.firebaseapp.com` / `.web.app`.
- **Current admin allow-list:** `gadiger14@gmail.com` (no admin password stored anywhere).

## Android package name
`com.aasthi.app` — consistent across `frontend/app.json` (`android.package` and
`ios.bundleIdentifier`), `android/app/build.gradle` (`namespace` and
`applicationId`), and the Firebase Android app registration in
`google-services.json`. Nothing to align.

## Completed features
- Firebase **Auth**: Email/Password (auto-register on first sign-in) + **Google** (web popup).
- **Home / Search / Detail** from live Firestore; category filters; **Saved** (persists to `users/{uid}`).
- **Detail**: gallery, facts, seller, nearby, **360° tour** viewer, enquiry/contact/visit → writes `leads` + `notifications`.
- **Sellers** directory + seller detail.
- **Sell/List** multi-step flow with **photo upload to Storage** → writes to `listings` (status `pending`).
- **Seller "Get verified"**: uploads Govt ID + ownership proof to Storage → `verificationRequests` (pending).
- **Profile ecosystem**: account edit (+avatar upload), settings (lang/currency/theme), privacy toggles, notifications feed, help/FAQ, support (call/WhatsApp), report-bug → `bugReports`, about/terms/policy, delete/logout flows.
- **/admin web panel** (FastAPI + Admin SDK): review seller **verifications** (approve → user `verified=true`), **listing approvals** (approve → `verified`, reject → `rejected`), and **bug reports**. Gated by Firebase ID token + `ADMIN_EMAILS` (non-admin → 403, no token → 401).

## Mocked / unfinished
- **Razorpay Boost** checkout — button shows a toast; no real order/verify (needs Razorpay test keys; the server-side helper is not yet written).
- **Google Places** autocomplete — location screens use a manual address field.
- **Native Google sign-in** (Expo Go/build) — shows "activates on installed build"; needs a Google OAuth Web Client ID + expo-auth-session + a native build. Web popup works now.
- **Phone OTP** and **FCM push notifications** — only function on a native build.
- **i18n** — language preference stored; UI strings not translated.
- **MongoDB** — present in template, not used (data is in Firebase).

## Known issues / notes
- `npx tsc --noEmit` shows expo-router **typed-route href** warnings on dynamic
  query routes (e.g. `/detail?id=...`). Type-only; runtime is fine; ESLint clean.
- Firestore runs with `experimentalForceLongPolling`; browser console logs
  `net::ERR_ABORTED` on Firestore `/channel` — this is normal long-poll cycling.
- Automated tests cannot complete the real Google OAuth consent screen (needs a
  human click); the flow, domain authorization, and allow-list are verified.

## Security work required before production
1. ~~Replace the OPEN dev Firestore/Storage rules~~ — DONE. `firebase/firestore.rules`
   and `firebase/storage.rules` now ARE the live hardened production rules.
2. Do not reintroduce a downloaded service-account key. The deployed function
   uses Application Default Credentials; the old key was deleted on 2026-09-08.
3. Lock **CORS** on the admin API to your real browser origins (currently `*`).
   Note the Android app needs no CORS entry — it sends no Origin header. See
   `functions/.env.example`.
4. Restrict the **Firebase Web API key** in Google Cloud Console (HTTP referrers / API restrictions).
5. Review **verification document** access — store under `verifications/{uid}` with read denied to clients (admin reads via Admin SDK).
6. ~~Align the Android package name~~ — DONE. `com.aasthi.app` is consistent
   across `app.json`, `android/app/build.gradle` and `google-services.json`.

## Exact next recommended task
**Wire Razorpay Boost checkout (test mode).** Add an endpoint pair in
`functions/main.py` (`/api/payments/order` to create an order and
`/api/payments/verify` to verify the signature) using Razorpay test keys
stored in `functions/.env`
(`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`), then connect the existing
`app/sell/boost.tsx` "Pay with Razorpay" button and, on success, set
`boosted:true` + `boostExpiry` on the listing in Firestore. This is the only
P1 revenue feature already stubbed in the UI and unblocks monetisation.
