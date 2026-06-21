# Deploying Brighter Dayz to Google Cloud (Cloud Run) + Google Play Store

This packages the whole app as **one container** (FastAPI serves the built React app **and** the `/api`).
You get a single HTTPS URL — perfect for your domain `brighterdayz.faith` and for wrapping into an Android app.

---

## 0) One-time prerequisites
- Install the **Google Cloud CLI**: https://cloud.google.com/sdk/docs/install
- Install **Node.js 18+** and **Java JDK 17** (for the Play Store wrapper, Bubblewrap).
- Have your Google Cloud project ID handy. Create one at https://console.cloud.google.com (e.g., `brighter-dayz`).

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

---

## 1) Database — MongoDB Atlas (Cloud Run is stateless, so you need a hosted DB)
1. Create a **free MongoDB Atlas** cluster: https://www.mongodb.com/atlas
2. Database Access → add a user/password.
3. Network Access → allow `0.0.0.0/0` (or Atlas + Google Cloud peering for production).
4. Copy the connection string, e.g.:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## 2) Deploy the backend+frontend container to Cloud Run
From the **/app** folder (where the `Dockerfile` is):

```bash
gcloud run deploy brighter-dayz \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars "DB_NAME=brighterdayz,JWT_SECRET=PUT_A_LONG_RANDOM_STRING,EMERGENT_LLM_KEY=YOUR_EMERGENT_LLM_KEY,SMTP_HOST=smtp.gmail.com,SMTP_PORT=465,SMTP_USER=43101loraine@hlmllc.org,SENDER_EMAIL=43101loraine@hlmllc.org,ADMIN_EMAIL=parent@brighterdayz.faith,ADMIN_PASSWORD=CHANGE_ME" \
  --set-env-vars "^@@^MONGO_URL=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority" \
  --set-env-vars "SMTP_PASSWORD=qmwzypwgyxclaynq"
```

Notes:
- The `^@@^` trick lets the MongoDB URL contain commas safely.
- **Secrets:** for production, prefer **Secret Manager** over `--set-env-vars` for `SMTP_PASSWORD`, `JWT_SECRET`, `EMERGENT_LLM_KEY`:
  ```bash
  echo -n "qmwzypwgyxclaynq" | gcloud secrets create SMTP_PASSWORD --data-file=-
  gcloud run services update brighter-dayz --region us-central1 \
    --set-secrets "SMTP_PASSWORD=SMTP_PASSWORD:latest"
  ```
- After deploy, gcloud prints a URL like `https://brighter-dayz-xxxxx-uc.a.run.app`. Open it — the full app should load (same origin, so `/api` just works).

---

## 3) Connect your domain `brighterdayz.faith`
```bash
gcloud beta run domain-mappings create --service brighter-dayz \
  --domain brighterdayz.faith --region us-central1
```
- gcloud will show DNS records (A/AAAA or CNAME) to add at your domain registrar.
- Add them; HTTPS certificate is provisioned automatically (a few minutes to a few hours).
- Verify: `https://brighterdayz.faith` loads the app, and `https://brighterdayz.faith/privacy` works.

---

## 4) Publish to Google Play Store (TWA wrapper)
Your deployed site already includes a PWA `manifest.json` and an `assetlinks.json` placeholder.

### a) Generate the Android app with Bubblewrap (Google's official tool)
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://brighterdayz.faith/manifest.json
# answers: app name "Brighter Dayz", package id e.g. faith.brighterdayz.app
bubblewrap build
```
This produces a signed **.aab** (App Bundle) and a signing key. **Keep the keystore safe.**

### b) Wire up Digital Asset Links (removes the browser URL bar in the app)
1. In Play Console → your app → **Setup → App signing**, copy the **SHA-256 certificate fingerprint**.
2. Edit `/app/frontend/public/.well-known/assetlinks.json`:
   - set `package_name` to your chosen id (e.g. `faith.brighterdayz.app`)
   - paste the SHA-256 fingerprint
3. Redeploy (step 2) so it's served at `https://brighterdayz.faith/.well-known/assetlinks.json`.

### c) Create the app in Google Play Console
1. https://play.google.com/console → **Create app**.
2. Upload the `.aab` to an **Internal testing** track first (fast review), then Production later.
3. **Store listing:** title, short/long description, screenshots, 512×512 icon, 1024×500 feature graphic, and **Privacy Policy URL = `https://brighterdayz.faith/privacy`**.

### d) Children's-app requirements (important)
- **Target audience & content:** choose the child age groups → triggers **Designed for Families**.
- **Data safety form:** disclose what you collect (name, age, messages, mood data) and that it's used for app functionality and child safety — **not** sold or used for ads.
- **Content rating (IARC):** complete the questionnaire (educational/health, no ads to children).
- **Families policy:** no third-party ads to under-13, COPPA compliance (your Privacy Policy already covers this).

---

## 5) Email deliverability (so parent alerts don't land in spam)
In Google Workspace Admin / your DNS, make sure **SPF, DKIM, DMARC** are set for the sending domain.
When you create `alerts@brighterdayz.faith` (or a send-as alias), update `SMTP_USER`/`SENDER_EMAIL` env vars on Cloud Run.

---

## Quick reference — environment variables Cloud Run needs
| Var | Value |
|-----|-------|
| MONGO_URL | your Atlas connection string |
| DB_NAME | brighterdayz |
| JWT_SECRET | long random string |
| EMERGENT_LLM_KEY | your Emergent universal key |
| SMTP_HOST / SMTP_PORT | smtp.gmail.com / 465 |
| SMTP_USER / SENDER_EMAIL | your Workspace email (or alerts@brighterdayz.faith) |
| SMTP_PASSWORD | Gmail App Password (use Secret Manager) |
| ADMIN_EMAIL / ADMIN_PASSWORD | seed parent account (change the password!) |
| CORS_ORIGINS | https://brighterdayz.faith |

That's it — `gcloud run deploy` builds the Dockerfile, hosts it, and gives you a live HTTPS app you can map to your domain and wrap for Play.
