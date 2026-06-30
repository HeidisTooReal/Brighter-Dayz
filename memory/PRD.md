# Brighter Dayz — PRD

## Bug fix — 2026-06-30 ("I can't login" on production)
- **Symptom:** Login failed on production with "Something went wrong." (worked fine via the brighterdayz.faith URL, failed via mindful-youth-13.emergent.host).
- **Root cause:** The production frontend (served at mindful-youth-13.emergent.host) calls the backend at a DIFFERENT origin (REACT_APP_BACKEND_URL = https://brighterdayz.faith, the now-live custom domain). The frontend sent credentialed requests (axios `withCredentials:true` in lib/api.js + ChatBuddy.js fetch `credentials:'include'`) while the backend CORS returned `Access-Control-Allow-Origin: *` with `allow_credentials=True`. Browsers BLOCK wildcard-origin + credentials → all cross-origin calls (incl. /api/auth/login) failed.
- **Fix (code):** App is fully Bearer-token (localStorage), so credentials aren't needed. Removed `withCredentials:true` (frontend/src/lib/api.js) and `credentials:'include'` (frontend/src/pages/ChatBuddy.js). Also set backend CORS `allow_credentials=False` (server.py) so wildcard origin is valid and this class of bug can't recur.
- **Verified:** testing_agent iteration_9 (10/10 backend + FE e2e login/chat/TTS, no regression). CORS preflight now returns ACAO:* without allow-credentials; cross-origin POST login = 200. Login confirmed working via UI at brighterdayz.faith.
- **ACTION REQUIRED BY USER:** Immediate workaround — use https://brighterdayz.faith to log in (works now). Permanent fix needs a REDEPLOY to push the code change so mindful-youth-13.emergent.host also works.
- **Follow-up (optional):** set CORS_ORIGINS to explicit prod origins; add res.ok check before reading chat stream in ChatBuddy.js.


## Bug fix — 2026-06-29 (app voice reverted to AI on preview)
- **Symptom:** On preview, read-aloud "voice changed" — it was using the OpenAI Coral AI fallback instead of the owner's cloned voice.
- **Root cause:** Both preview & production share the SAME `ELEVENLABS_API_KEY`, so they share one ElevenLabs voice library. Preview's `app_config.app_voice.voice_id` was `9TxZk...`; when the owner's voice was uploaded to PRODUCTION, the prod POST `/api/app-voice` deleted the existing ElevenLabs voice (`9TxZk`) before creating prod's new clone (`5St5`). That left preview pointing at a deleted voice_id, so `voiceclone.synthesize` threw and `/api/tts` fell back to `source:'ai'`.
- **Fix:** Re-created the clone on preview from the owner's recording (new voice_id `V1crH5...`) via POST `/api/app-voice`. Preview `/api/tts` now returns `source:'clone'`. Production still has working clone `5St5`. Preview & prod now hold DISTINCT voice_ids, so future re-uploads won't cross-delete.
- **Verified:** testing_agent iteration_8 — backend 4/4 PASS, frontend Read-aloud e2e PASS (source=clone, ~937KB mp3). retest_needed=false.
- **Known follow-up (optional, not done):** add a voice_id health probe on GET /api/app-voice + user-facing error toast in ReadAloud.js if /api/tts fails (suggested by tester).


## Changelog — 2026-06-25 (app-wide owner voice)
- **Single global app voice (set by OWNER):** corrected from per-parent to one developer/owner voice used app-wide for ALL children. Owner = account whose email == ADMIN_EMAIL (`parent@brighterdayz.org`).
  - Backend: stored in `app_config` doc `{key:"app_voice", voice_id, name, updated_at}`. Endpoints `GET /api/app-voice` (returns enabled/is_owner/voice), `POST /api/app-voice` (owner-only, multipart, creates ElevenLabs clone), `DELETE /api/app-voice` (owner-only). `/api/tts` uses this global voice for every user; falls back to OpenAI `tts-1-hd` Coral. `OWNER_EMAIL` const added; removed per-user `voice_profiles`.
  - Frontend: `components/VoiceCloneCard.js` now renders ONLY for owner (`is_owner`), titled "Sunny's Voice (app-wide)", record/preview/save/test/remove via `/api/app-voice`.
  - Verified e2e via curl with real ElevenLabs key: set→voice_id, `/api/tts` source=clone for all, delete→source=ai. Owner card renders behind Parent PIN (2468). NOTE: live mic record→save needs real browser mic — owner to validate on device.

- **Voice cloning (ElevenLabs) — your voice everywhere:** Parent records ~30–60s once → Instant Voice Clone created → `voice_id` saved in `voice_profiles` (one per user). ALL read-aloud (`/api/tts`) now uses the cloned voice when present, else falls back to OpenAI `tts-1-hd` Coral. Covers Sunny chat, books, AI stories, affirmations, prayers, daily verse.
  - Backend: `/app/backend/voiceclone.py` (elevenlabs SDK 2.54.0; `voices.ivc.create`, `text_to_speech.convert` model `eleven_multilingual_v2`, `voices.delete`). Endpoints: `GET/POST/DELETE /api/voice-clone`. `/api/tts` returns `source: clone|ai`.
  - Frontend: `components/VoiceCloneCard.js` (MediaRecorder) at top of Parent Dashboard — record/preview/save/test/re-record/remove, with a warm reading script.
  - Key: `ELEVENLABS_API_KEY` in backend/.env (user's paid Starter key). EMERGENT_LLM_KEY does NOT work for ElevenLabs.
  - **Reverted** the earlier per-book recording approach: removed `VoiceNarration.js`, `storage.py`, and `/api/narrations*` endpoints. Story/Library readers use plain `ReadAloud` again (cloned voice flows via `/api/tts`).
  - **Verified e2e via curl with real key:** clone→`voice_id`, `/api/tts` source=clone, delete→fallback source=ai. Parent card renders (screenshot). NOTE: live mic record→save not exercised in automation (needs real browser mic) — user to validate.


## Changelog — 2026-06-25 (this session)
- **Voice softer/natural:** TTS switched to OpenAI `tts-1-hd`, voice `coral`, speed `0.92` (backend TTSInput + /tts; ReadAloud default voice now `coral`).
- **More Jesus:** strengthened Sunny system prompt (Jesus loves you), added 5 Jesus-centered DAILY_VERSES, Jesus woven into affirmation/real-life story prompts.
- **Story Library (NEW):** `/app/backend/books.py` = 20 ready-to-read books (10 Bible/Jesus + 10 everyday-life). Endpoints `GET /api/books`, `GET /api/books/{id}`. Frontend page `StoryLibrary.js` at route `/kid/:childId/library`, with All/Bible/Real-Life filters; KidHome tile "Story Library" added, AI generator renamed "Make a Story".
- **Record-my-voice narration (NEW):** parent records own voice to replace AI per story. `/app/backend/storage.py` = Emergent object storage helpers (init/put/get). Endpoints: `POST /api/narrations` (multipart), `GET /api/narrations`, `GET /api/narrations/{ref_type}/{ref_id}`, `GET /api/narration-audio/{id}?auth=token` (query-param auth for <audio>), `DELETE /api/narrations/{id}`. Collection `narrations` (user-owned; soft-delete; one per user+ref). Frontend `VoiceNarration.js` (MediaRecorder) used in StoryLibrary reader + StoryTime. Behavior: when a recording exists, child hears ONLY the grown-up's voice (AI hidden); else AI read-aloud + record button. StoryTime now saves story first so AI stories have an id to narrate.
- **Deploy fixes:** removed `**/.env` from `.dockerignore`; removed `.env*` and `memory/test_credentials.md` from `.gitignore` so Emergent includes them. deployment_agent: PASS.
- **Verified:** backend narration flow e2e via curl (upload/list/get/stream 200/delete). Story Library + reader render verified via screenshot. NOTE: actual mic recording not exercised in automation (needs real browser mic permission) — user will validate by recording their voice.


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
