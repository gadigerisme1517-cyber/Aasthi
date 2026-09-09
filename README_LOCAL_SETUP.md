# AASTHI — Local Setup (Windows, non-technical friendly)

This guide gets the AASTHI app running on your Windows PC. Take it slowly; each
step is copy‑paste. You do **not** need to be a programmer.

---

## 1. Install the required free software (one time)

Install these, accepting all default options:

1. **Node.js (LTS)** — https://nodejs.org  (gives you `node` and `npm`)
2. **Yarn** — after Node installs, open **PowerShell** and run:
   ```
   npm install -g yarn
   ```
3. **Python 3.11+** — https://www.python.org/downloads/
   ⚠️ On the first install screen, TICK **“Add Python to PATH”**.
4. **Git** (optional but recommended) — https://git-scm.com
5. On your **phone**, install the **“Expo Go”** app (Play Store / App Store) to
   preview the mobile app. You can also preview in a web browser.

Close and reopen PowerShell after installing, so it picks up the new tools.

---

## 2. Unzip the project

Right‑click the ZIP → **Extract All…** → choose a simple location like
`C:\aasthi`. You should end up with `C:\aasthi\frontend`, `C:\aasthi\functions`, etc.

---

## 3. Add your secret settings (the ZIP ships without secrets)

### Frontend
1. Open the `frontend` folder.
2. Copy the file `.env.example` and rename the copy to `.env`.
   (The Firebase values are already filled in — they are safe to use.)

### Admin API
Nothing to do. The admin API runs as a deployed Cloud Function (`api_fn`) and
needs no local setup and no service-account file. `frontend/.env` already points
at it via `EXPO_PUBLIC_BACKEND_URL`.

---

## 4. The admin API (already running — nothing to start)

The admin API is deployed as the Cloud Function `api_fn` in project
**aasthi-3a009**. Its source is in the `functions/` folder. You do not need to
run anything locally.

Check it is up by visiting this in a browser:
```
https://us-central1-aasthi-3a009.cloudfunctions.net/api_fn/api/
```
You should see `{"service":"aasthi-admin","status":"ok"}`.

Only if you change `functions/main.py` do you need to redeploy:
```
cd C:\aasthi
firebase deploy --only functions
```

---

## 5. Start the app (frontend)

Open a **second** PowerShell window:
```
cd C:\aasthi\frontend
yarn install
npx expo start
```
Then:
- Press **`w`** to open the app in your web browser, **or**
- Scan the QR code with the **Expo Go** app on your phone.

The **admin panel** is the web address + `/admin` (e.g. `http://localhost:8081/admin`
in the browser). Sign in with **Continue with Google** using an allow‑listed
admin email (currently `gadiger14@gmail.com`).

---

## 6. (Optional) Load the demo listings

If Firestore is empty and you want the sample sellers/listings back:
```
cd C:\aasthi\scripts
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
python seed_firestore.py
```

---

## Common issues
- **“command not found”** → close & reopen PowerShell after installing Node/Python.
- **App is blank at first** → the bundler is still starting; wait ~30–60s.
- **Google sign‑in popup blocked** → allow pop‑ups for the site; the app’s domain
  must be listed under Firebase → Authentication → Settings → Authorized domains
  (`localhost` is allowed by default).
- **Red Firestore `ERR_ABORTED` lines in the browser console** → normal, ignore.

You’re done. One window running (the frontend) = the full app; the admin API is
already deployed as a Cloud Function.
