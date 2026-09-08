# CLAUDE.md — AASTHI project guide for Claude Code

> Read this fully before editing. This project is a **working** app. Do not
> refactor, redesign, or replace live Firebase features with mocks.

## What AASTHI is
A premium real-estate marketplace for Kurnool, India (Buy / Rent / Plots /
Commercial) with verified sellers, 360° tours, saved listings, enquiries/visits,
a seller listing flow, a seller "Get verified" flow, and a web **/admin** panel.
The mobile UI is a faithful build of a provided HTML mockup — keep the design.

## Tech stack
- **Frontend:** Expo (SDK 54) + Expo Router (file-based) + TypeScript + React 19.
  Firebase JS SDK (v12) on the client. Inter fonts via expo-font.
  @expo/vector-icons for icons. expo-image / expo-linear-gradient / expo-blur /
  expo-image-picker. Local key-value via `@/src/utils/storage`.
- **Backend:** FastAPI (Python) + Firebase **Admin SDK**. Serves `/api/admin/*`.
- **Data/Identity:** **Firebase** — Auth (Email/Password + Google web popup),
  Cloud Firestore, Cloud Storage. (MongoDB exists in the template but is unused.)

## Architecture / data flow
- The app talks **directly to Firebase** from the client for normal user data
  (auth, listings, sellers, saved, settings, leads, notifications, uploads).
- The **FastAPI backend is used only for admin** actions, because they need the
  Admin SDK (privileged) and an allow-list check. Admin endpoints verify a
  Firebase **ID token** (Bearer) and check the caller email against
  `ADMIN_EMAILS`.
- Firestore uses `experimentalForceLongPolling: true` (the hosted preview proxy
  aborts WebChannel streams). `net::ERR_ABORTED` on Firestore `/channel` is
  normal long-poll cycling, not an error.

### Firestore collections
- `sellers`      : {id:int, name, meta, trust, verified, img, cover, sold, rating} (doc id `s{id}`)
- `listings`     : {type, price, title, addr, beds, baths, area, facing, dist, seller:int, img, g:[], desc, verificationStatus:'pending'|'verified'|'rejected', boosted?, sellerUid?, createdAt} (doc id = auto)
- `users`        : {name, phone, email, city, type, avatar, verified, setup:bool, saved:[listingId], blocked:[sellerId], settings:{...}} (doc id = Firebase uid)
- `leads`        : {listingId, sellerId, buyerUid, type:'enquiry'|'contact'|'visit', ts}
- `notifications`: {uid, title, body, ts}
- `bugReports`   : {ticket, category, desc, uid, appVersion, ts}
- `verificationRequests`: {sellerUid, sellerName, idDocUrl, ownershipDocUrl, status:'pending'|'approved'|'rejected', ts}

## Key files
```
frontend/
  app/                         # Expo Router routes (each file = a screen)
    _layout.tsx                # providers, fonts, splash
    index.tsx                  # splash + auth redirect
    auth/login.tsx, auth/profile-setup.tsx
    (tabs)/_layout.tsx         # custom bottom tab bar (Home/Search/List/Saved/Profile)
    (tabs)/index.tsx           # Home
    (tabs)/search.tsx, saved.tsx, profile.tsx
    detail.tsx, tour.tsx, vastu.tsx, enquiry.tsx, contact.tsx, visit.tsx
    sellers.tsx, seller.tsx
    sell/*                     # multi-step listing flow (index,type,location,...,preview,done,boost)
    verify.tsx                 # seller "Get verified" submission
    account.tsx, notif-prefs.tsx, privacy.tsx, change-password.tsx, settings.tsx
    help.tsx, support-chat.tsx, report-bug.tsx, bug-submitted.tsx
    about.tsx, terms.tsx, policy.tsx, notifications.tsx, blocked.tsx
    delete-confirm.tsx, account-deleted.tsx, logout-confirm.tsx, logged-out.tsx
    admin/index.tsx            # /admin web dashboard (login + verifications/listings/bugs)
  src/
    theme.ts, icons.tsx
    data/seed.ts               # demo sellers/listings + settings/types
    store/AppContext.tsx       # global state + all Firebase actions
    services/firebase.ts       # Firebase init (auth/firestore/storage)
    services/db.ts             # Firestore + Storage + auth helpers
    services/authProviders.ts  # Google sign-in (web popup)
    services/adminApi.ts       # calls FastAPI /api/admin/* with Firebase ID token
    components/ui.tsx, cards.tsx, choice.tsx
    utils/storage/             # provided KV storage wrapper
  assets/fonts/Inter-*.ttf
backend/
  server.py                    # FastAPI app + Firebase Admin init + /api/admin/*
  requirements.txt
firebase/
  firestore.rules, storage.rules   # the LIVE production rules — must match what is deployed
scripts/
  seed_firestore.py            # seed demo sellers/listings (Admin SDK or REST)
```

## Commands
- Frontend: `cd frontend && yarn install && npx expo start`
  (web: press `w`; phone: Expo Go + QR). Lint: `npx eslint app src`.
- Backend:  `cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8001 --reload`
- Seed:     `cd scripts && GOOGLE_APPLICATION_CREDENTIALS=./service-account.json python seed_firestore.py`
- All backend routes are prefixed `/api`. Admin routes: `/api/admin/*`.

## Environment
- Copy `frontend/.env.example` → `frontend/.env` and `backend/.env.example` → `backend/.env`.
- Firebase **web** config (in frontend .env) is safe/public. The **service
  account** (backend `FIREBASE_ADMIN_CREDENTIALS_B64`) is SECRET.
- `ADMIN_EMAILS` (backend) = allow-listed admin emails.

## Completed features
Auth (email/password + Google web), Home/Search/Detail/Saved, sellers + seller
detail, full Sell/List flow with photo upload to Storage, 360 tour viewer,
enquiry/contact/visit → leads + notifications, profile ecosystem (account,
settings, privacy, notifications, help/FAQ, support, report-bug, about/terms/
policy, delete/logout), seller "Get verified" submission, and the /admin panel
(seller verifications, listing approvals, bug reports).

## Pending / not done (need external keys or a build)
- **Razorpay** Boost checkout — UI shows a toast; backend verify not wired (needs Razorpay test keys).
- **Google Places** autocomplete on the location screens (manual field for now).
- **Native Google sign-in** (Expo Go/build) — needs a Google OAuth Web Client ID + expo-auth-session + a build. Web popup works today.
- **Phone OTP** and **FCM push** — activate only on a native build.
- **i18n** (Telugu/Hindi) — preference is stored; strings not translated.

## Open questions (undecided — do not "fix" without a decision)
- **Who should a lead notify?** `src/services/db.ts` `addLead()` writes the
  notification with `uid: payload.buyerUid`, so the *buyer* receives
  "The seller has been notified and will respond shortly." The seller is never
  notified. The comment on the `notifications` block in
  `firebase/firestore.rules` describes the opposite intent ("created for
  another user (e.g. seller notified of a buyer's enquiry)"), and the rule
  itself allows creating a notification addressed to someone else. Either the
  buyer-side receipt is intentional and the rules comment is stale, or the
  seller notification was never wired up. Undecided as of 2026-09-08 — leave
  as-is until the owner rules on it.

## Learned on 2026-09-08 (branch `restore/c-aa-2026-07`)

**This branch has been run on a real device.** Built and installed on a Galaxy
S24 Ultra (Android 16) and walked end to end: create a listing (title/beds/baths),
enquiry with a message, visit with a time slot, change password, delete-account
then cancel, block/unblock a seller, listing detail, and the contact pill. No
crashes, no red boxes, no JS exceptions. Everything below was found by that walk,
not by reading the code.

- **A confirmation screen must never write.** `enquiry.tsx` and `visit.tsx` used
  to confirm by navigating to `/contact`, whose mount effect calls
  `addLead(..., "contact")`. So every enquiry and every visit silently wrote a
  *second*, wrongly-typed lead and notification, and confirmed with the wrong
  words ("Contact Request Sent"). It survived because `addLead` is
  fire-and-forget with a swallowed `.catch(() => {})`, so nothing ever surfaced —
  the only visible symptom was a pile of "Contact request sent" rows. Fixed by
  adding `app/request-sent.tsx`, a purely presentational confirmation whose copy
  is driven by `?type=`. Keep it side-effect free. `contact.tsx` still writes,
  which is correct: `/contact` *is* the contact action.
- **The area unit is owned by the unit picker, not the value.**
  `app/sell/details.tsx` appends `UNIT_SUFFIX[unit]` on save, so `draft.area`
  must stay a bare number. When the default carried its own "sq.ft", every
  listing saved as "2,240 sq.ft sq.ft" — and picking any other unit produced
  "2,240 sq.ft acres", i.e. the picker was worse than inert. `bareArea()` in that
  file strips a suffix that is already present, because `useState(draft.area)`
  repopulates the field from a saved draft and would otherwise double it again.
- **The corrupted rupee sign came from source, not from the database.**
  `freshDraft().price` held `â‚¹` (U+00E2 U+201A U+00B9), the UTF-8 bytes of
  `₹` read as Windows-1252, so every new listing inherited it. Fixed at source;
  the three already-stored rows were repaired with `scripts/repair_mojibake.py`
  on 2026-09-08 and that script now reports 0. If you write Firestore from a
  shell script, check the encoding — this is the same class of bug that mangles
  backslashes in generated files on this machine.

## STRICT rules for future work
1. Do NOT commit secrets. `.env`, service-account JSON, google-services.json are gitignored — keep it that way.
2. Do NOT replace live Firebase with mock data. Do NOT downgrade Email/Password or Google auth.
3. Keep all backend routes under `/api`. Admin stays gated by Firebase ID token + `ADMIN_EMAILS`.
4. `firebase/firestore.rules` and `firebase/storage.rules` ARE the live production rules and must always match what is deployed in the Firebase console. Never replace them with the old open development version (`allow read, write: if true`) — deploying that would expose the entire production database and every uploaded verification document. If you need permissive rules to test something locally, use the emulator; do not edit these files to get it.
5. Use `@/src/utils/storage` for local KV (not AsyncStorage directly) except Firebase's own auth persistence.
6. `npx tsc --noEmit` reports expo-router typed-route href warnings on dynamic query routes (e.g. `/detail?id=...`). These are type-narrowing warnings only — runtime is fine and ESLint is clean. Do not mass-refactor to "fix" them.
7. Don't change `metro.config.js` or the Expo packager env vars.
