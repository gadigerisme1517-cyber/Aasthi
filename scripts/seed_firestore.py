#!/usr/bin/env python3
"""
AASTHI — Firestore seed script.

Seeds the demo `sellers` (3) and `listings` (4) that ship with the app.
Idempotent: skips seeding if the `sellers` collection already has documents.

Two ways to run (pick one):

  A) Admin SDK (recommended) — uses the service account:
     Set env var GOOGLE_APPLICATION_CREDENTIALS to the path of your
     service-account.json, then:
         pip install firebase-admin
         python scripts/seed_firestore.py

  B) REST (no service account) — uses the public web API key + a throwaway
     signed-in user (works while Firestore rules are open/dev):
         export FIREBASE_API_KEY=...           # EXPO_PUBLIC_FIREBASE_API_KEY
         export FIREBASE_PROJECT_ID=aasthi-3a009
         python scripts/seed_firestore.py --rest

No secrets are hardcoded in this file.
"""
import os
import sys
import json
import datetime
import urllib.request

SELLERS = [
    {"id": 0, "name": "Sri Homes Realty", "city": "Kurnool", "trust": "Top seller", "verified": True,
     "img": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
     "cover": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80"},
    {"id": 1, "name": "Kurnool Estates", "city": "Kurnool", "trust": "Verified", "verified": True,
     "img": "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=300&q=80",
     "cover": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=500&q=80"},
    {"id": 2, "name": "Urban Nest", "city": "Kurnool", "trust": "Verified", "verified": True,
     "img": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
     "cover": "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=500&q=80"},
]

LISTINGS = [
    {"seedId": "1", "type": "Buy", "price": "₹1.34 Cr", "title": "Quiet luxury villa with 360° walkthrough", "addr": "Nandyal Road, Kurnool", "beds": "4", "baths": "4", "area": "3,200", "facing": "East", "dist": "2.1 km", "seller": 0,
     "img": "https://images.pexels.com/photos/35289099/pexels-photo-35289099.jpeg?auto=compress&cs=tinysrgb&w=800",
     "g": ["https://images.pexels.com/photos/34968154/pexels-photo-34968154.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/31959779/pexels-photo-31959779.jpeg?auto=compress&cs=tinysrgb&w=800"],
     "desc": "A premium independent villa with wide road access, bright interiors, elegant finishes and a guided 360° tour.", "verificationStatus": "verified"},
    {"seedId": "2", "type": "Rent", "price": "₹42,000/mo", "title": "Fully furnished apartment near city centre", "addr": "Ashok Nagar, Kurnool", "beds": "3", "baths": "3", "area": "1,740", "facing": "North", "dist": "1.4 km", "seller": 2,
     "img": "https://images.pexels.com/photos/7672058/pexels-photo-7672058.jpeg?auto=compress&cs=tinysrgb&w=800",
     "g": ["https://images.pexels.com/photos/7672060/pexels-photo-7672060.jpeg?auto=compress&cs=tinysrgb&w=800"],
     "desc": "A calm, fully furnished rental with strong natural light, lift access, parking and daily essentials nearby.", "verificationStatus": "verified"},
    {"seedId": "3", "type": "Plots", "price": "₹68 L", "title": "Premium east-facing residential plot", "addr": "Panchalingala Road, Kurnool", "beds": "-", "baths": "-", "area": "266 yd", "facing": "East", "dist": "4.8 km", "seller": 1,
     "img": "https://images.pexels.com/photos/34359456/pexels-photo-34359456.jpeg?auto=compress&cs=tinysrgb&w=800",
     "g": [],
     "desc": "Clear-title residential plot with strong road visibility and a calm developing neighbourhood.", "verificationStatus": "verified"},
    {"seedId": "4", "type": "Commercial", "price": "₹96 L", "title": "Main road commercial shop frontage", "addr": "Bellary Chowrasta, Kurnool", "beds": "-", "baths": "1", "area": "820", "facing": "West", "dist": "0.8 km", "seller": 1,
     "img": "https://images.pexels.com/photos/29547315/pexels-photo-29547315.jpeg?auto=compress&cs=tinysrgb&w=800",
     "g": ["https://images.pexels.com/photos/17499591/pexels-photo-17499591.jpeg?auto=compress&cs=tinysrgb&w=800"],
     "desc": "Compact commercial frontage with high visibility and practical fit-out potential.", "verificationStatus": "verified"},
]


def seed_admin():
    import firebase_admin
    from firebase_admin import credentials, firestore
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    else:
        firebase_admin.initialize_app()  # uses ADC
    db = firestore.client()
    if list(db.collection("sellers").limit(1).stream()):
        print("Already seeded — skipping.")
        return
    for s in SELLERS:
        db.collection("sellers").document(f"s{s['id']}").set(s)
    for l in LISTINGS:
        db.collection("listings").add({**l, "createdAt": firestore.SERVER_TIMESTAMP})
    print(f"Seeded {len(SELLERS)} sellers, {len(LISTINGS)} listings (Admin SDK).")


def seed_rest():
    api = os.environ["FIREBASE_API_KEY"]
    project = os.environ.get("FIREBASE_PROJECT_ID", "aasthi-3a009")
    base = f"https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents"
    body = json.dumps({"email": f"seed{int(datetime.datetime.now().timestamp())}@example.com", "password": "seedpass123", "returnSecureToken": True}).encode()
    tok = json.load(urllib.request.urlopen(urllib.request.Request(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api}", data=body, headers={"Content-Type": "application/json"})))["idToken"]

    def val(v):
        if isinstance(v, bool): return {"booleanValue": v}
        if isinstance(v, int): return {"integerValue": str(v)}
        if isinstance(v, list): return {"arrayValue": {"values": [val(x) for x in v]}}
        return {"stringValue": str(v)}

    def fields(d): return {"fields": {k: val(x) for k, x in d.items()}}
    hdr = {"Content-Type": "application/json", "Authorization": f"Bearer {tok}"}
    for s in SELLERS:
        urllib.request.urlopen(urllib.request.Request(f"{base}/sellers/s{s['id']}?key={api}", data=json.dumps(fields(s)).encode(), headers=hdr, method="PATCH"))
    for l in LISTINGS:
        f = fields(l); f["fields"]["createdAt"] = {"timestampValue": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")}
        urllib.request.urlopen(urllib.request.Request(f"{base}/listings?key={api}", data=json.dumps(f).encode(), headers=hdr, method="POST"))
    print(f"Seeded {len(SELLERS)} sellers, {len(LISTINGS)} listings (REST).")


if __name__ == "__main__":
    if "--rest" in sys.argv:
        seed_rest()
    else:
        seed_admin()
