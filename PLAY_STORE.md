# 📱 Publishing Brighter Dayz to the Google Play Store (TWA)

This guide turns your live website into an installable Android app using a
**Trusted Web Activity (TWA)** via **Bubblewrap**, then submits it to the
**Google Play Console**.

> The TWA is a thin Android wrapper that loads your live site. Your website
> must be live at a stable HTTPS URL first.

---

## ✅ Decisions already locked in
| Item | Value |
|------|-------|
| App name | **Brighter Dayz** |
| Android package name (permanent) | **faith.brighterdayz.app** |
| Target URL (recommended) | **https://brighterdayz.faith** |
| Theme color | `#457B9D` |
| Background color | `#FDFBF7` |
| Min Android | 6.0 (API 23) |

> If you launch **before** connecting your custom domain, replace
> `brighterdayz.faith` everywhere below with your Emergent URL
> `mindful-youth-13.emergent.host` (and host assetlinks there). Switching to the
> custom domain later is a routine app update.

---

## 0) Prerequisites (one-time)
- A **Google Play Console** developer account → https://play.google.com/console (**$25 one-time**)
- On your computer install:
  - **Node.js 18+** (https://nodejs.org)
  - **Java JDK 17** (Temurin/Adoptium)
  - **Bubblewrap CLI**: `npm install -g @bubblewrap/cli`
  - (Bubblewrap can auto-download the Android SDK on first run.)

---

## 1) Your site is already prepared ✅
The web app already serves everything a TWA needs:
- `https://brighterdayz.faith/manifest.json` (PWA manifest with proper icons)
- Icons: `logo192.png`, `logo512.png`, `maskable512.png`
- Digital Asset Links file at:
  `https://brighterdayz.faith/.well-known/assetlinks.json`

> ⚠️ The assetlinks file currently has a **placeholder** fingerprint. You'll
> paste your real signing fingerprint into it in **Step 4**, then redeploy.

---

## 2) Initialize the Android project with Bubblewrap
On your computer, in an empty folder:

```bash
bubblewrap init --manifest https://brighterdayz.faith/manifest.json
```

When prompted, confirm/enter:
- **Domain:** `brighterdayz.faith`
- **Application name:** `Brighter Dayz`
- **Package name / Application ID:** `faith.brighterdayz.app`
- **Display mode:** `standalone`
- **Orientation:** `portrait`
- **Status bar / theme color:** `#457B9D`
- **Splash background:** `#FDFBF7`
- Let it **generate a new signing key** when asked (save the keystore + passwords somewhere safe!).

> A ready-made `twa-manifest.json` is included in this repo root if you prefer
> to copy values from it.

---

## 3) Build the Android App Bundle (.aab)
```bash
bubblewrap build
```
This produces:
- **app-release-bundle.aab** ← upload this to Play Console
- (and an `app-release-signed.apk` you can sideload to test)

Test on a phone (optional):
```bash
bubblewrap install   # installs the APK on a connected Android device
```

---

## 4) Connect the app to your domain (Digital Asset Links)
This removes the browser URL bar so it looks like a real app.

1. Get your **app's SHA-256 signing fingerprint**:
   ```bash
   keytool -list -v -keystore android.keystore -alias android
   ```
   Copy the **SHA256** line (looks like `AB:CD:12:...`).
2. Open `frontend/public/.well-known/assetlinks.json` in this project and
   replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FROM_PLAY_CONSOLE` with that
   fingerprint.
3. **Redeploy** the web app so the new assetlinks goes live.

> 💡 IMPORTANT: After you upload to Play and enable **Play App Signing**
> (recommended), Google re-signs your app with **its own** key. Use the SHA-256
> shown in **Play Console → Setup → App signing**. You may end up listing **two**
> fingerprints in assetlinks.json (your upload key + Google's app-signing key) —
> add both inside the `sha256_cert_fingerprints` array.

Verify it's served:
```bash
curl https://brighterdayz.faith/.well-known/assetlinks.json
```

---

## 5) Create the app in Google Play Console
1. Go to https://play.google.com/console → **Create app**.
2. App name: **Brighter Dayz** · Default language: **English (US)** · Type: **App** · **Free**.
3. Upload the **.aab** under **Release → Production → Create new release**.

### Store listing assets (in this repo)
- **App icon (512×512):** `frontend/public/logo512.png`
- **Feature graphic (1024×500):** `frontend/public/playstore_feature_1024x500.png`
- **Screenshots:** capture 2–8 phone screenshots from the live app (sign-in, kid
  home, a storybook, breathing, badges). Min 2 required.
- **Short description (≤80 chars):**
  `A gentle, faith-filled app helping kids share feelings, find calm & feel loved.`
- **Full description:** use the text in `PLAY_STORE_LISTING.md` (see below).

---

## 6) Required questionnaires (extra-important for a KIDS app)
Because the audience includes children, Google requires these — answer carefully:

- **Privacy Policy URL:** `https://brighterdayz.faith/privacy`
- **Data safety form:** declare what you collect (account email, child first
  name + age, mood entries, chat messages). State it is used for app
  functionality and safety monitoring, not sold. Mention safety alerts emailed
  to parents.
- **Content rating questionnaire:** complete it (expect **Everyone**).
- **Target audience & content:** select age groups **including under 13**. This
  enrolls you in **"Designed for Families"** and Google's child-safety policy —
  you'll confirm compliance, COPPA/GDPR-K, ads (you have **none**), and that the
  app is appropriate for children.
- **App access:** since sign-in is required, provide Google reviewers a **test
  login** (create a demo parent account on production and share those
  credentials in the "App access" section).

---

## 7) Submit for review
- Complete all dashboard checkmarks → **Send for review**.
- Review for family/kids apps can take **a few days to ~2 weeks**.
- After approval, your app is live on the Play Store. 🎉

---

## 🔁 Pushing updates later
- **Website/content changes** (stories, voice, text): just redeploy the web app —
  the installed app loads the live site, so users get updates instantly, **no Play
  resubmission needed**.
- **App-level changes** (name, icon, switching the URL to your domain, Android
  settings): bump `appVersionCode` in `twa-manifest.json`, run `bubblewrap build`,
  and upload the new `.aab` to Play Console.

---

## 📎 Quick file reference (already in this project)
- `frontend/public/manifest.json` — PWA manifest (TWA reads this)
- `frontend/public/.well-known/assetlinks.json` — domain↔app link (add fingerprint)
- `frontend/public/logo512.png` — Play Store hi-res icon (512×512)
- `frontend/public/logo192.png`, `maskable512.png` — app icons
- `frontend/public/playstore_feature_1024x500.png` — Play feature graphic
- `twa-manifest.json` (repo root) — Bubblewrap config template
- `PLAY_STORE_LISTING.md` — ready-to-paste store listing text
