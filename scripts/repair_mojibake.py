#!/usr/bin/env python3
"""
One-off repair for mojibake in Firestore string fields.

Some rows were written by a tool that read UTF-8 bytes as Windows-1252 and
re-encoded them, so the rupee sign U+20B9 (bytes E2 82 B9) became the three
characters "â" "‚" "¹" (U+00E2 U+201A U+00B9). The same corruption affects any
non-ASCII character written by that path, e.g. "’" -> "â€™".

The repair is the exact inverse: encode the damaged text back to cp1252 bytes
and decode those bytes as UTF-8.

    "â‚¹".encode("cp1252")  ->  b"\\xe2\\x82\\xb9"  ->  .decode("utf-8")  ->  "₹"

DRY RUN BY DEFAULT. Nothing is written unless you pass --apply.

Auth: uses your own gcloud credentials, so no service-account key is needed
(the downloaded admin key was deleted on 2026-09-08). A project owner's OAuth
token talks to the Firestore REST API as an administrator and bypasses the
security rules, which is required because `leads` and `notifications` deny all
client reads.

    gcloud auth login
    gcloud config set project aasthi-3a009

Usage:
    python repair_mojibake.py                      # dry run, listings only
    python repair_mojibake.py --collections listings notifications
    python repair_mojibake.py --apply              # actually write

Verify afterwards by re-running without --apply; it should report 0 rows.
"""

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PROJECT = "aasthi-3a009"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"

# Characters that only realistically appear in text damaged this way. A string
# with none of these is left completely alone, so clean rows are never touched.
MOJIBAKE_MARKERS = "Ââã €‚™œ"


def get_token() -> str:
    """Fetch an OAuth access token from the local gcloud install."""
    try:
        out = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True, text=True, check=True, shell=(sys.platform == "win32"),
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        sys.exit(
            "Could not get a gcloud access token. Run:\n"
            "    gcloud auth login\n"
            "    gcloud config set project %s\n\n%s" % (PROJECT, exc)
        )
    token = out.stdout.strip()
    if not token:
        sys.exit("gcloud returned an empty access token.")
    return token


def repair(text: str):
    """Return the repaired string, or None if this text is not damaged.

    Conservative on purpose: it only returns a value when the round trip
    succeeds cleanly, actually changes something, and introduces no U+FFFD.
    """
    if not any(ch in text for ch in MOJIBAKE_MARKERS):
        return None
    try:
        fixed = text.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None          # not this corruption; leave it alone
    if fixed == text or "�" in fixed:
        return None
    return fixed


def api(url: str, token: str, method="GET", body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        sys.exit("%s %s failed: %s\n%s" % (method, url, exc.code,
                                           exc.read().decode("utf-8", "replace")))


def scan_collection(name: str, token: str, apply: bool):
    fixed_docs = 0
    fixed_fields = 0
    page_token = None

    while True:
        params = {"pageSize": "300"}
        if page_token:
            params["pageToken"] = page_token
        payload = api("%s/%s?%s" % (BASE, name, urllib.parse.urlencode(params)), token)

        for doc in payload.get("documents", []):
            doc_id = doc["name"].rsplit("/", 1)[-1]
            changes = {}
            for field, value in (doc.get("fields") or {}).items():
                if "stringValue" not in value:
                    continue
                new = repair(value["stringValue"])
                if new is not None:
                    changes[field] = new

            if not changes:
                continue

            fixed_docs += 1
            fixed_fields += len(changes)
            print("\n%s/%s" % (name, doc_id))
            for field, new in changes.items():
                old = doc["fields"][field]["stringValue"]
                print("    %-14s %r" % (field, old))
                print("    %-14s %r" % ("->", new))

            if apply:
                mask = "&".join("updateMask.fieldPaths=" + urllib.parse.quote(f)
                                for f in changes)
                api(
                    "%s/%s/%s?%s" % (BASE, name, doc_id, mask),
                    token,
                    method="PATCH",
                    body={"fields": {f: {"stringValue": v} for f, v in changes.items()}},
                )
                print("    written")

        page_token = payload.get("nextPageToken")
        if not page_token:
            break

    return fixed_docs, fixed_fields


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--collections", nargs="+", default=["listings"],
                    help="collections to scan (default: listings)")
    ap.add_argument("--apply", action="store_true",
                    help="actually write the repairs (default is a dry run)")
    args = ap.parse_args()

    # This script exists to print non-ASCII text, so it must not die on a
    # console that cannot encode it (Windows cp1252 cannot represent U+20B9).
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, ValueError):
        pass

    token = get_token()
    print("MODE:", "APPLY - writing changes" if args.apply else "DRY RUN - nothing written")
    print("project:", PROJECT)
    print("collections:", ", ".join(args.collections))

    total_docs = total_fields = 0
    for name in args.collections:
        docs, fields = scan_collection(name, token, args.apply)
        total_docs += docs
        total_fields += fields

    print("\n%s: %d document(s), %d field(s)"
          % ("repaired" if args.apply else "would repair", total_docs, total_fields))
    if total_docs and not args.apply:
        print("Re-run with --apply to write these changes.")


if __name__ == "__main__":
    main()
