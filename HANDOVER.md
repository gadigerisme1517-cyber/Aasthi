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
├── backend/                  # FastAPI + Firebase Admin SDK
│   ├── server.py             # app + /api + /api/admin/* routes
│   ├── requirements.txt
│   └── .env.example          # backend env (secret names only)
├── firebase/
│   ├── firestore.rules       # CURRENT dev rules + recommended prod rules
│   └── storage.rules         # CURRENT dev rules + recommended prod rules
└── scripts/
    └── seed_firestore.py     # seeds the 3 demo sellers + 4 demo listings
```
> Note: `frontend/babel.config.js` is intentionally absent — Expo SDK 54 uses its
> built-in `babel-preset-expo` defaults; no custom Babel config is required.
> `node_modules`, real `.env` files, build outputs and any service-account/
> secret files are deliberately NOT included.

## Start commands
- **Frontend:** `cd frontend && yarn install && npx expo start`  (press `w` for web; Expo Go for phone). Admin panel: web URL + `/admin`.
- **Backend:**  `cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8001 --reload`
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

**backend/.env** (SECRET — never commit):
`FIREBASE_ADMIN_CREDENTIALS_B64` (base64 of service-account JSON),
`ADMIN_EMAILS` (comma-separated allow-list), `MONGO_URL`, `DB_NAME` (Mongo unused today).

## Firebase project
- **Project ID:** `aasthi-3a009`
- **Auth domain:** `aasthi-3a009.firebaseapp.com`
- **Storage bucket:** `aasthi-3a009.firebasestorage.app`
- **Enabled:** Email/Password + Google auth, Firestore, Storage.
- **Authorized domains** include `localhost` and the hosted preview domain.
- **Current admin allow-list:** `gadiger14@gmail.com` (no admin password stored anywhere).

## Android package name
`com.emergent.appcraft.navjwn`  (in `frontend/app.json`, iOS bundle id identical).
The original Firebase Android app registration in `google-services.json` used
`com.aasthi.app`; align these before an Android production build.

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
- **Razorpay Boost** checkout — button shows a toast; no real order/verify (needs Razorpay test keys; backend helper not yet written).
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
1. **Replace the OPEN dev Firestore/Storage rules** with the hardened versions in `firebase/firestore.rules` / `firebase/storage.rules`.
2. Keep the **service account** only in backend `.env` (base64) — never in the app bundle or git.
3. Lock **CORS** on the backend to your real domains (currently `*`).
4. Restrict the **Firebase Web API key** in Google Cloud Console (HTTP referrers / API restrictions).
5. Review **verification document** access — store under `verifications/{uid}` with read denied to clients (admin reads via Admin SDK).
6. Align the **Android package name** with the Firebase Android app before building.

## Exact next recommended task
**Wire Razorpay Boost checkout (test mode).** Add a backend endpoint pair
(`/api/payments/order` to create an order and `/api/payments/verify` to verify
the signature) using Razorpay test keys stored in `backend/.env`
(`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`), then connect the existing
`app/sell/boost.tsx` "Pay with Razorpay" button and, on success, set
`boosted:true` + `boostExpiry` on the listing in Firestore. This is the only
P1 revenue feature already stubbed in the UI and unblocks monetisation.
