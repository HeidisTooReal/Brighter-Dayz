# Brighter Dayz — Test Credentials

## Demo Parent Account (seeded on startup)
- **Email:** parent@brighterdayz.org
- **Password:** Sunshine123
- **Role:** parent
- **Parent PIN:** 2468 (set during testing; gates the Parent Dashboard)

## Account roles
- **parent** — sets up & monitors child profiles; can set a 4–6 digit PIN to open the Parent Dashboard without re-login.
- **teen** — self sign-up for kids aged 13+ (Google Play / COPPA minimum). On register, a personal child profile is auto-created and they go straight to Kid Mode. Under-13 self sign-up is blocked with a "ask a parent" message.

## Deploy-readiness (2026-06-21)
- Domain registered: **brighterdayz.faith**. App name locked: **Brighter Dayz** (operator: HLM LLC).
- Public **Privacy Policy** (/privacy) and **Terms of Service** (/terms) pages, linked from sign-in + in-app LegalFooter (Profiles, Parent Dashboard). COPPA-aware; cover AI, mood data, prayers, safety-alert emails. Contact: privacy@ / support@brighterdayz.faith (create mailboxes in Workspace).
- App metadata/branding set in index.html + manifest.json (theme #457B9D).
- Optimized /api/parent/overview (batched $in + aggregation, no N+1).
- deployment_agent: PASS (no hardcoded secrets, env-only URLs, CORS ok). Final regression iteration_7: 100% BE + FE.

## Parent alert emails (Google Workspace SMTP) — LIVE
- Sends via Gmail/Workspace SMTP (smtp.gmail.com:465, App Password) using smtplib + asyncio.to_thread.
- Configured in backend/.env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (App Password), SENDER_EMAIL.
- Sender account: 43101loraine@hlmllc.org. Verified end-to-end: alarming child chat -> AI classifies risk -> alert stored + styled email delivered to the parent's inbox.
- Test parent account (real inbox): 43101loraine@hlmllc.org / TestPass123

## New auth endpoints
- POST /auth/register now accepts {name,email,password,role,age}; role=teen requires age>=13.
- POST /auth/set-pin {pin}  (authenticated, parent)
- POST /auth/verify-pin {pin}  (authenticated, parent)
- GET  /auth/me now returns has_pin

## Auth model
- Parents register/sign in with email + password (JWT httpOnly cookie).
- Children are **profiles owned by the parent** (no separate child logins). A parent
  creates child profiles, then taps a child to enter the playful Kid Mode.
- All child data (moods, chat, stories, activities, rewards) is owned by the parent.

## Key API endpoints (all prefixed /api)
- POST /auth/register {name,email,password}
- POST /auth/login {email,password}
- GET  /auth/me
- POST /auth/logout
- GET/POST /children ; GET/DELETE /children/{id}
- POST/GET /children/{id}/moods
- POST/GET /children/{id}/activities
- GET  /children/{id}/rewards
- POST /children/{id}/chat (streaming) ; GET /children/{id}/chat/history
- POST /affirmation/generate ; POST /story/generate
- POST /children/{id}/stories/save ; GET /children/{id}/stories
- POST /tts {text,voice}
- GET  /daily ; GET /parent/overview
