# Brighter Dayz — PRD

## Original Problem Statement
A faith-based (Christian/biblical) mental health app for school-age children (ages 5–14),
a companion to BetterDayz.org. Warm, hopeful, safe, and playful.

## Personas
- **Child (5–8 / 9–14):** checks in on feelings, talks to Sunny, breathes, hears stories & affirmations, plays calm games, earns stars.
- **Parent/Guardian:** owns the account, creates child profiles, monitors mood trends & activity.

## Architecture
- **Frontend:** React (CRA + craco), Tailwind, framer-motion, recharts, lucide-react. Fonts: Fredoka (kids) + Nunito (parent/body).
- **Backend:** FastAPI + MongoDB (motor). JWT auth via httpOnly cookie.
- **AI:** Claude Sonnet 4.6 (buddy chat, affirmations, stories) + OpenAI TTS tts-1 (read-aloud), via emergentintegrations + EMERGENT_LLM_KEY.
- **Auth model:** Parent owns account; children are profiles under the parent (no separate child login). COPPA-friendly.

## Implemented (2026-06-20)
- Parent register/login/logout/me (JWT cookie, brute-force-safe seed parent).
- Child profiles CRUD with emoji avatars; profile selection screen.
- Kid Home: mascot greeting, daily verse + affirmation, 5-emoji mood check-in, bento activity grid, stars/streak header.
- AI Buddy chat (Sunny) — streaming, kid-safe faith-based guardrails, persistent history, read-aloud.
- Breathe & Calm — animated 4-7-8 + Box breathing, cycle counter, activity logging.
- Story Time — AI biblical + real-life stories with Good Shepherd art, auto-save, read-aloud.
- Happy Words — AI affirmations (feeling-aware) with read-aloud.
- Calm Games — Worry Bubbles + Thankful Garden.
- Crisis "Get Help" — floating button + /help page (911, 988, Crisis Text Line, Childhelp, trusted-adult).
- Rewards — stars, day-streak, badges.
- Parent Dashboard — per-child last mood, activity count, stars, streak, mood-trend chart, recent check-ins, delete.
- Mascot art (Sunny the lamb) + animated Jesus/Good Shepherd (Chosen-Adventures style) generated.

## Implemented (2026-06-21) — Faith refuge features
- **Prayer Corner** ("Talk to God"): write/save prayers with gentle prompts, an AI "Help me pray" generator (Claude), read-aloud, delete; saving awards stars. Endpoints: /prayer/generate, /children/{id}/prayers (CRUD).
- **God's Promises** (Scripture Library): 8 comforting verse sets grouped by feeling (scared, sad, worried, lonely, angry, courage, thankful, loved), each read-aloud. Endpoint: /scriptures.
- **Badge-unlock confetti** celebration on Kid Home when a mood check-in crosses a star threshold into a new badge. Verified 100% (iteration_5).
- Kid Home now has 8 activity tiles. Good Shepherd / animated Jesus art used in Promises + Story Time.

## Code quality (2026-06-21)
- Empty catch blocks now log; stable React keys for chat messages + gratitude items; intentional mount-effects lint-silenced; zero compile warnings.
- Note: token kept in localStorage (Bearer) by design — httpOnly cookies fail in the cross-origin Preview iframe on Safari.

## Testing
- 22/22 backend pytest pass (/app/backend/tests/test_brighterdayz_api.py). Frontend e2e flows verified.

## Implemented (2026-06-21) — Auth roles, age gate, Parent PIN
- Switched auth from httpOnly cookies to **Bearer token (localStorage)** — fixes iframe/mobile third-party-cookie 401s. One-time setup; session persists.
- **Account roles:** `parent` (manages child profiles) and `teen` (self sign-up, age 13+ per Google Play/COPPA). Teen register auto-creates their own profile and routes straight to Kid Mode; under-13 self sign-up blocked with a gentle "ask a parent" message.
- **Parent PIN** (4–6 digits, bcrypt-hashed): gates the Parent Dashboard so a parent can monitor without re-login and keep kids out. Set/Change PIN from Profiles.
- New endpoints: /auth/set-pin, /auth/verify-pin; /auth/register accepts role+age; /auth/me & login/register return has_pin.
- Verified: 33/33 backend + 100% frontend flows (iteration_2 & iteration_3 reports).

## Backlog / Next
- P1: Treat each Claude StreamDone as a message boundary in ChatBuddy (cosmetic).
- P1: Final app name lock (Brighter Dayz working) + optional rename; richer kid-mode rename UX.
- P2: Prayer journal (write-to-God), scripture library browse-by-category (like BetterDayz).
- P2: Per-child PIN to lock the Parent Dashboard; production CORS/secure-cookie hardening.
- P2: Persist partial chat reply on client disconnect; Pydantic validation on story-save.
- P3: Notifications/daily reminders; printable badge certificate; more mini-games.
