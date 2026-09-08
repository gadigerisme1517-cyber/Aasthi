import logging
import os

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import firestore
from firebase_functions import https_fn, options
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from starlette.middleware.cors import CORSMiddleware
from a2wsgi import ASGIMiddleware
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aasthi")

# Lazy init: Firebase CLI's local "discover functions" step imports this
# module without real cloud credentials available, so touching Firestore or
# calling initialize_app() at import time hangs that step. Only the actual
# deployed function (with its attached service account) ever calls this.
def _ensure_initialized():
    if not firebase_admin._apps:
        firebase_admin.initialize_app()


_db_client = None


def _db():
    global _db_client
    if _db_client is None:
        _ensure_initialized()
        _db_client = firestore.client()
    return _db_client

ADMIN_EMAILS = {
    e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()
}

_allowed_origins_env = os.environ.get("ADMIN_ALLOWED_ORIGINS", "").strip()
if _allowed_origins_env:
    ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
else:
    logger.warning(
        "ADMIN_ALLOWED_ORIGINS is not set - CORS is wide open (*). "
        "Set it to your real /admin origin(s) before production."
    )
    ALLOWED_ORIGINS = ["*"]

app = FastAPI(title="AASTHI Admin API")
api_router = APIRouter(prefix="/api")


def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    _ensure_initialized()
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
    pending_v = len(list(_db().collection("verificationRequests").where("status", "==", "pending").stream()))
    pending_l = len(list(_db().collection("listings").where("verificationStatus", "==", "pending").stream()))
    bugs = len(list(_db().collection("bugReports").stream()))
    return {"pendingVerifications": pending_v, "pendingListings": pending_l, "bugReports": bugs}


@api_router.get("/admin/verifications")
def verifications(admin: dict = Depends(require_admin)):
    docs = _db().collection("verificationRequests").stream()
    items = sorted([_doc(d) for d in docs], key=lambda x: x.get("ts", 0), reverse=True)
    return {"items": items}


@api_router.post("/admin/verifications/{req_id}/{action}")
def verification_action(req_id: str, action: str, admin: dict = Depends(require_admin)):
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="bad action")
    ref = _db().collection("verificationRequests").document(req_id)
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
        _db().collection("users").document(uid).set({"verified": True}, merge=True)
    return {"ok": True, "status": status}


@api_router.get("/admin/listings")
def listings(status: str = "pending", admin: dict = Depends(require_admin)):
    q = _db().collection("listings")
    if status != "all":
        q = q.where("verificationStatus", "==", status)
    items = sorted([_doc(d) for d in q.stream()], key=lambda x: x.get("ts", 0), reverse=True)
    return {"items": items}


@api_router.post("/admin/listings/{listing_id}/{action}")
def listing_action(listing_id: str, action: str, admin: dict = Depends(require_admin)):
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="bad action")
    ref = _db().collection("listings").document(listing_id)
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
    docs = _db().collection("bugReports").stream()
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

# Lazy, same reason as _db(): ASGIMiddleware spins up a background thread
# with its own event loop at construction time. Building it at module level
# means that thread gets created in gunicorn's master process before it
# forks worker processes - threads don't survive fork(), so the worker that
# actually handles requests ends up with a middleware object pointing at a
# loop nobody is running, and every request hangs forever with no error.
# Building it lazily on first request guarantees it's created inside the
# worker process that will actually use it.
_wsgi_app_instance = None


def _wsgi_app():
    global _wsgi_app_instance
    if _wsgi_app_instance is None:
        _wsgi_app_instance = ASGIMiddleware(app)
    return _wsgi_app_instance


@https_fn.on_request(
    memory=options.MemoryOption.GB_1,
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post", "options"]),
)
def api_fn(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(_wsgi_app(), req.environ)
