import base64
import json
import logging
import os
from pathlib import Path
from typing import Optional

import firebase_admin
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from firebase_admin import auth as fb_auth
from firebase_admin import credentials, firestore
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aasthi")

# ---- Firebase Admin init ----
_sa = json.loads(base64.b64decode(os.environ["FIREBASE_ADMIN_CREDENTIALS_B64"]))
if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(_sa))
db = firestore.client()

ADMIN_EMAILS = {
    e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()
}

_allowed_origins_env = os.environ.get("ADMIN_ALLOWED_ORIGINS", "").strip()
if _allowed_origins_env:
    ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
else:
    logger.warning(
        "ADMIN_ALLOWED_ORIGINS is not set — CORS is wide open (*). "
        "Set it to your real /admin origin(s) before production."
    )
    ALLOWED_ORIGINS = ["*"]

app = FastAPI(title="AASTHI Admin API")
api_router = APIRouter(prefix="/api")


# ---- Auth dependency ----
def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        decoded = fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    email = (decoded.get("email") or "").lower()
    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not an admin account")
    return decoded


def _doc(d):
    data = d.to_dict() or {}
    data["id"] = d.id
    ts = data.get("ts") or data.get("createdAt")
    if ts is not None and hasattr(ts, "timestamp"):
        data["ts"] = int(ts.timestamp() * 1000)
    return data


@api_router.get("/")
async def root():
    return {"service": "aasthi-admin", "status": "ok"}


@api_router.get("/admin/check")
def admin_check(admin: dict = Depends(require_admin)):
    return {"admin": True, "email": admin.get("email")}


@api_router.get("/admin/overview")
def overview(admin: dict = Depends(require_admin)):
    pending_v = len(list(db.collection("verificationRequests").where("status", "==", "pending").stream()))
    pending_l = len(list(db.collection("listings").where("verificationStatus", "==", "pending").stream()))
    bugs = len(list(db.collection("bugReports").stream()))
    return {"pendingVerifications": pending_v, "pendingListings": pending_l, "bugReports": bugs}


@api_router.get("/admin/verifications")
def verifications(admin: dict = Depends(require_admin)):
    docs = db.collection("verificationRequests").stream()
    items = sorted([_doc(d) for d in docs], key=lambda x: x.get("ts", 0), reverse=True)
    return {"items": items}


@api_router.post("/admin/verifications/{req_id}/{action}")
def verification_action(req_id: str, action: str, admin: dict = Depends(require_admin)):
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="bad action")
    ref = db.collection("verificationRequests").document(req_id)
    try:
        snap = ref.get()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    if not snap.exists:
        raise HTTPException(status_code=404, detail="not found")
    status = "approved" if action == "approve" else "rejected"
    ref.update({"status": status, "reviewedBy": admin.get("email")})
    data = snap.to_dict() or {}
    uid = data.get("sellerUid")
    if uid and action == "approve":
        db.collection("users").document(uid).set({"verified": True}, merge=True)
    return {"ok": True, "status": status}


@api_router.get("/admin/listings")
def listings(status: str = "pending", admin: dict = Depends(require_admin)):
    q = db.collection("listings")
    if status != "all":
        q = q.where("verificationStatus", "==", status)
    items = sorted([_doc(d) for d in q.stream()], key=lambda x: x.get("ts", 0), reverse=True)
    return {"items": items}


@api_router.post("/admin/listings/{listing_id}/{action}")
def listing_action(listing_id: str, action: str, admin: dict = Depends(require_admin)):
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="bad action")
    ref = db.collection("listings").document(listing_id)
    try:
        exists = ref.get().exists
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")
    if not exists:
        raise HTTPException(status_code=404, detail="not found")
    ref.update({"verificationStatus": "verified" if action == "approve" else "rejected"})
    return {"ok": True}


@api_router.get("/admin/bugs")
def bugs(admin: dict = Depends(require_admin)):
    docs = db.collection("bugReports").stream()
    items = sorted([_doc(d) for d in docs], key=lambda x: x.get("ts", 0), reverse=True)
    return {"items": items}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
