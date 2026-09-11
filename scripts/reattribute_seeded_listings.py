#!/usr/bin/env python3
"""
AASTHI - one-off: move mis-attributed listings off the seeded sellers.

THE BUG THIS CLEANS UP
----------------------
publishListing used to write `seller: 0` on every user's property. 0 is the
numeric id of the seeded company "Sri Homes Realty", so every listing published
before that fix is counted and displayed as theirs. On the phone this shows up
as Sri Homes Realty claiming 8 listings and a locality line reading
"Nandyal Road - test". The cards are counting honestly; the data is wrong.

HOW A MIS-ATTRIBUTED LISTING IS IDENTIFIED - no guesswork
---------------------------------------------------------
    seller in {0, 1, 2}   attributed to a seeded company
    AND no sellerUid      so nothing points at a real account
    AND no seedId         the four genuinely seeded listings all HAVE seedId
                          (db.ts writes it in seedIfEmpty), so its absence is
                          proof the document was published by a person.

Anything with seedId is left alone. It really does belong to the seeded seller.

WHAT IT WRITES, PER LISTING
---------------------------
    sellerUid       the uid you supply
    seller          -1  (USER_SELLER_ID)
    sellerName      \
    sellerAvatar     |
    sellerCity       |  all seven read from users/{uid}, exactly as
    sellerPhone      |  identityFields() in AppContext derives them
    sellerBio        |
    sellerArea       |
    sellerVerified  /
    verificationStatus   only if you pass --verification pending

Nothing else on the document is read, written or deleted.

WHAT IT NEEDS FROM YOU BEFORE IT CAN RUN
----------------------------------------
1. ADMIN CREDENTIALS. Firebase console > Project settings > Service accounts >
   Generate new private key, saved OUTSIDE the repo, then
       pip install firebase-admin
       $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\service-account.json"
   It cannot be done from the app: firestore.rules only lets an account update
   a listing it ALREADY owns, so nobody can hand a listing to themselves.

2. THE UID that these listings should move to. Firebase console >
   Authentication > Users, the "User UID" column for that account.

3. WHICH LISTINGS MOVE. Run --list first; it prints every candidate with its
   id, title, address and price. Then either pass --ids with the ones you want
   or --all to move every candidate to the same uid.

4. A DECISION ON THE VERIFIED BADGE. --verification is REQUIRED:
       keep      the listing keeps whatever verificationStatus it has
       pending   reset to "pending", so a real account does not inherit a
                 Verified badge it never earned
   There is no default. This is a trust claim, not a formatting choice.

HOW TO RUN IT
-------------
    python scripts/reattribute_seeded_listings.py --list
    python scripts/reattribute_seeded_listings.py --uid <UID> --all --verification pending
    python scripts/reattribute_seeded_listings.py --uid <UID> --all --verification pending --apply

Without --apply nothing is written: it prints the exact per-field diff.

Exit codes: 0 success, 1 misconfiguration or a missing decision.
"""
import os
import sys

# Matches BATCH_LIMIT in frontend/src/services/db.ts. Firestore allows 500
# operations per batch; 450 leaves headroom.
BATCH_LIMIT = 450

# frontend/src/data/seed.ts: USER_SELLER_ID = -1
USER_SELLER_ID = -1

# The seeded seller ids. Kept explicit rather than "anything >= 0" so a future
# seeded seller has to be added here deliberately.
SEEDED_SELLER_IDS = {0, 1, 2}

IDENTITY_FIELDS = (
    "sellerName",
    "sellerAvatar",
    "sellerCity",
    "sellerPhone",
    "sellerBio",
    "sellerArea",
    "sellerVerified",
)


def identity_from_profile(profile):
    """Mirrors identityFields() in frontend/src/store/AppContext.tsx and
    identity_from_profile() in backfill_seller_identity.py. If one of those
    changes, change all three in the same commit."""
    return {
        "sellerName": profile.get("name") or "",
        "sellerAvatar": profile.get("avatar") or "",
        "sellerCity": profile.get("city") or "",
        "sellerPhone": (profile.get("phone") or "").strip(),
        "sellerBio": profile.get("bio") or "",
        "sellerArea": profile.get("operatingAreas") or "",
        "sellerVerified": bool(profile.get("verified")),
    }


def arg(name):
    """--name value, or None."""
    if name not in sys.argv:
        return None
    i = sys.argv.index(name)
    return sys.argv[i + 1] if i + 1 < len(sys.argv) else None


def is_candidate(data):
    if data.get("sellerUid"):
        return False
    if data.get("seedId"):
        return False
    return data.get("seller") in SEEDED_SELLER_IDS


def main():
    listing_mode = "--list" in sys.argv
    apply = "--apply" in sys.argv
    uid = arg("--uid")
    ids = arg("--ids")
    take_all = "--all" in sys.argv
    verification = arg("--verification")

    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("GOOGLE_APPLICATION_CREDENTIALS is not set. See the header of this file.")
        return 1
    try:
        import firebase_admin
        from firebase_admin import firestore
    except ImportError:
        print("firebase-admin is not installed. Run: pip install firebase-admin")
        return 1

    if not listing_mode:
        if not uid:
            print("--uid is required (Firebase console > Authentication > User UID).")
            return 1
        if not take_all and not ids:
            print("Pass --all, or --ids a,b,c. Run --list first to see the candidates.")
            return 1
        if verification not in ("keep", "pending"):
            print(
                "--verification is required and must be 'keep' or 'pending'.\n"
                "A seeded listing carries verificationStatus 'verified'. Moving it to a\n"
                "real account that never submitted documents hands them a badge they did\n"
                "not earn. There is no default for that."
            )
            return 1

    firebase_admin.initialize_app()
    db = firestore.client()

    print("Reading listings...")
    snaps = list(db.collection("listings").stream())
    print("  %d listings total" % len(snaps))

    candidates = [(s, s.to_dict() or {}) for s in snaps]
    candidates = [(s, d) for s, d in candidates if is_candidate(d)]

    print("  %d mis-attributed (seeded seller id, no sellerUid, no seedId)\n" % len(candidates))

    if listing_mode:
        for s, d in candidates:
            print("  %s" % s.id)
            print("      seller: %s   title: %s" % (d.get("seller"), d.get("title")))
            print("      addr:   %s   price: %s" % (d.get("addr"), d.get("price")))
            print("      verificationStatus: %s" % d.get("verificationStatus"))
        if not candidates:
            print("Nothing to move.")
        return 0

    wanted_ids = None if take_all else {x.strip() for x in ids.split(",") if x.strip()}
    chosen = [(s, d) for s, d in candidates if wanted_ids is None or s.id in wanted_ids]

    if wanted_ids is not None:
        missing = wanted_ids - {s.id for s, _ in chosen}
        if missing:
            print("These ids are not candidates (or do not exist): %s" % ", ".join(sorted(missing)))
            return 1

    user_snap = db.collection("users").document(uid).get()
    if not user_snap.exists:
        print("No users/%s document. Check the uid." % uid)
        return 1
    identity = identity_from_profile(user_snap.to_dict() or {})

    print("Moving %d listing(s) to %s (%s)\n" % (len(chosen), uid, identity["sellerName"] or "no name set"))

    writes = []
    for s, d in chosen:
        change = {"sellerUid": uid, "seller": USER_SELLER_ID}
        change.update(identity)
        if verification == "pending":
            change["verificationStatus"] = "pending"
        writes.append((s.reference, change, s.id, d))
        print("  %s  (%s)" % (s.id, d.get("title")))
        print("      seller: %s -> %s" % (d.get("seller"), USER_SELLER_ID))
        print("      sellerUid: <none> -> %s" % uid)
        for k in IDENTITY_FIELDS:
            print("      %s: %r -> %r" % (k, d.get(k), change[k]))
        if verification == "pending":
            print("      verificationStatus: %r -> 'pending'" % d.get("verificationStatus"))

    if not writes:
        print("\nNothing to do.")
        return 0

    if not apply:
        print("\nDRY RUN - nothing was written. Re-run with --apply to commit these.")
        return 0

    done = 0
    for start in range(0, len(writes), BATCH_LIMIT):
        chunk = writes[start:start + BATCH_LIMIT]
        batch = db.batch()
        for ref, change, _id, _d in chunk:
            batch.update(ref, change)
        batch.commit()
        done += len(chunk)
        print("Committed %d/%d" % (done, len(writes)))

    print("\nDone. %d listing(s) reattributed." % done)
    return 0


if __name__ == "__main__":
    sys.exit(main())
