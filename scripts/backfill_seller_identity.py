#!/usr/bin/env python3
"""
AASTHI - one-off backfill: refresh the seller identity copied onto listings.

WHY THIS EXISTS
---------------
A buyer cannot read users/{uid} - firestore.rules restricts that document to
its owner - so every listing carries a copy of its seller's name, photo, city,
phone, bio, service area and verified flag. From now on the app fans those
fields out to all of a seller's listings whenever they save their account
(frontend/src/store/AppContext.tsx, updateAccount). This script fixes the
listings that were published BEFORE that fan-out existed and still carry
whatever the seller's profile said at the moment they hit Publish.

It is a one-off. Run it once after deploying the build that contains the
fan-out. It is safe to run again: it writes only the listings whose copy
actually differs.

WHAT IT TOUCHES
---------------
Only these seven fields, only on documents in `listings` that have a
`sellerUid`:

    sellerName  sellerAvatar  sellerCity  sellerPhone
    sellerBio   sellerArea    sellerVerified

Nothing else on the listing is read, written or deleted. Seeded listings (no
sellerUid) are skipped entirely.

HOW TO RUN IT
-------------
It needs the Admin SDK, because it reads users/{uid} for every seller and the
client rules forbid that.

    1. Get a service account key:
         Firebase console > Project settings > Service accounts >
         Generate new private key.   Save it OUTSIDE the repo.
    2. pip install firebase-admin
    3. PowerShell:
         $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\service-account.json"
         python scripts/backfill_seller_identity.py            # dry run, writes NOTHING
         python scripts/backfill_seller_identity.py --apply    # actually writes

The dry run is the default on purpose. It prints one line per listing that
would change, naming the fields, so the diff can be read before anything is
committed.

Exit codes: 0 success, 1 misconfiguration (no credentials, missing package).
"""
import os
import sys

# Same cap the app uses. Firestore allows 500 operations per batch; 450 leaves
# headroom and keeps the two implementations in step
# (frontend/src/services/db.ts, BATCH_LIMIT).
BATCH_LIMIT = 450

FIELDS = (
    "sellerName",
    "sellerAvatar",
    "sellerCity",
    "sellerPhone",
    "sellerBio",
    "sellerArea",
    "sellerVerified",
)


def identity_from_profile(profile):
    """The seven fields, derived exactly as the app derives them.

    Mirrors identityFields() in frontend/src/store/AppContext.tsx. If that
    function changes, change this one in the same commit or the backfill will
    start fighting the app.
    """
    return {
        "sellerName": profile.get("name") or "",
        "sellerAvatar": profile.get("avatar") or "",
        "sellerCity": profile.get("city") or "",
        "sellerPhone": (profile.get("phone") or "").strip(),
        "sellerBio": profile.get("bio") or "",
        "sellerArea": profile.get("operatingAreas") or "",
        "sellerVerified": bool(profile.get("verified")),
    }


def main():
    apply = "--apply" in sys.argv

    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("GOOGLE_APPLICATION_CREDENTIALS is not set. See the header of this file.")
        return 1
    try:
        import firebase_admin
        from firebase_admin import firestore
    except ImportError:
        print("firebase-admin is not installed. Run: pip install firebase-admin")
        return 1

    firebase_admin.initialize_app()
    db = firestore.client()

    print("Reading listings...")
    listings = list(db.collection("listings").stream())
    print("  %d listings total" % len(listings))

    # One read per seller, not one per listing.
    profiles = {}
    pending = []   # (doc_ref, changes, listing_id, seller_uid)
    skipped_no_uid = 0
    skipped_no_profile = 0

    for snap in listings:
        data = snap.to_dict() or {}
        uid = data.get("sellerUid")
        if not uid:
            skipped_no_uid += 1
            continue

        if uid not in profiles:
            user_snap = db.collection("users").document(uid).get()
            profiles[uid] = user_snap.to_dict() if user_snap.exists else None

        profile = profiles[uid]
        if profile is None:
            # The seller's profile document is gone. Leaving the stale copy in
            # place is the honest outcome: blanking the listing would strip the
            # only identity a buyer has, and inventing one is worse.
            skipped_no_profile += 1
            continue

        wanted = identity_from_profile(profile)
        changes = {k: v for k, v in wanted.items() if data.get(k) != v}
        if changes:
            pending.append((snap.reference, changes, snap.id, uid))

    print("")
    print("Listings with no sellerUid (seeded, skipped): %d" % skipped_no_uid)
    print("Listings whose seller profile is missing (left alone): %d" % skipped_no_profile)
    print("Listings needing an update: %d" % len(pending))
    print("")

    for _ref, changes, listing_id, uid in pending:
        named = ", ".join("%s=%r" % (k, changes[k]) for k in FIELDS if k in changes)
        print("  %s (seller %s): %s" % (listing_id, uid, named))

    if not pending:
        print("\nNothing to do.")
        return 0

    if not apply:
        print("\nDRY RUN - nothing was written. Re-run with --apply to commit these.")
        return 0

    written = 0
    for start in range(0, len(pending), BATCH_LIMIT):
        chunk = pending[start:start + BATCH_LIMIT]
        batch = db.batch()
        for ref, changes, _id, _uid in chunk:
            batch.update(ref, changes)
        batch.commit()
        written += len(chunk)
        print("Committed %d/%d" % (written, len(pending)))

    print("\nDone. %d listings updated." % written)
    return 0


if __name__ == "__main__":
    sys.exit(main())
