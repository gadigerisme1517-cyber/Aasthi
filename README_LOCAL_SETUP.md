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
`C:\aasthi`. You should end up with `C:\aasthi\frontend`, `C:\aasthi\backend`, etc.

---

## 3. Add your secret settings (the ZIP ships without secrets)

### Frontend
1. Open the `frontend` folder.
2. Copy the file `.env.example` and rename the copy to `.env`.
   (The Firebase values are already filled in — they are safe to use.)

### Backend
1. Open the `backend` folder. Copy `.env.example` → `.env`.
2. You need your **Firebase service account** (a secret file):
   - Go to https://console.firebase.google.com → project **aasthi-3a009**
   - Gear icon → **Project settings** → **Service accounts** →
     **Generate new private key** → a `.json` file downloads.
3. Turn that JSON into one line of text:
   - In PowerShell (change the path to where your file is):
     ```
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\service-account.json"))
     ```
   - Copy the long line it prints.
4. Open `backend\.env` in Notepad and set:
   ```
   FIREBASE_ADMIN_CREDENTIALS_B64=PASTE_THE_LONG_LINE_HERE
   ADMIN_EMAILS=gadiger14@gmail.com
   ```
   Save the file. **Never share this file.**

---

## 4. Start the backend (admin API)

Open PowerShell and run:
```
cd C:\aasthi\backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
Leave this window open. Test it by visiting http://localhost:8001/api/ in a
browser — you should see `{"service":"aasthi-admin","status":"ok"}`.

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

You’re done. Two windows running (backend + frontend) = the full app.
