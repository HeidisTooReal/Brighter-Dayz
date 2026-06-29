"""
Iter-8: Owner cloned-voice (Sunny) read-aloud tests.

Verifies BUG FIX: previously /api/tts returned source='ai' because the stored
ElevenLabs voice_id was dangling. After the main agent re-created the clone
and saved it via POST /api/app-voice, /api/tts MUST now return source='clone'.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
# Fallback to frontend/.env when not in env
if not BASE_URL:
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

OWNER_EMAIL = "parent@brighterdayz.org"
OWNER_PASS = "Sunshine123"


@pytest.fixture(scope="module")
def owner_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": OWNER_EMAIL, "password": OWNER_PASS}, timeout=30)
    assert r.status_code == 200, f"owner login failed: {r.status_code} {r.text}"
    # Token may also be in body; cookie is set automatically via Session
    body = r.json()
    token = body.get("token") or body.get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---- /api/app-voice owner-gated ------------------------------------------------
class TestAppVoice:
    def test_get_app_voice_as_owner(self, owner_session):
        r = owner_session.get(f"{BASE_URL}/api/app-voice", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("enabled") is True, f"voice cloning must be enabled: {data}"
        assert data.get("is_owner") is True, f"parent@brighterdayz.org must be owner: {data}"
        voice = data.get("voice")
        assert isinstance(voice, dict) and voice, f"voice object missing: {data}"
        assert voice.get("voice_id"), f"voice_id must be non-empty: {voice}"
        assert isinstance(voice["voice_id"], str) and len(voice["voice_id"]) > 5
        assert voice.get("name") == "Sunny", f"voice name should be 'Sunny': {voice}"


# ---- /api/tts must return source='clone' (the bug-fix assertion) --------------
class TestTTSCloneSource:
    def test_tts_returns_clone_source(self, owner_session):
        r = owner_session.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Hello Sunny, this is a read aloud test."},
            timeout=90,
        )
        assert r.status_code == 200, f"/api/tts failed: {r.status_code} {r.text}"
        data = r.json()
        assert "audio" in data and isinstance(data["audio"], str)
        assert data["audio"].startswith("data:audio/mp3;base64,"), data["audio"][:60]
        # base64 payload should be non-trivial
        b64 = data["audio"].split(",", 1)[1]
        assert len(b64) > 500, f"audio payload too small: {len(b64)} bytes"
        assert data.get("source") == "clone", (
            f"BUG: /api/tts returned source={data.get('source')!r}, expected 'clone'. "
            f"This means the cloned voice_id is still dangling or ElevenLabs failed."
        )

    def test_tts_short_text(self, owner_session):
        r = owner_session.post(
            f"{BASE_URL}/api/tts", json={"text": "Hi!"}, timeout=60,
        )
        assert r.status_code == 200
        assert r.json().get("source") == "clone"

    def test_tts_unauthenticated_rejected(self):
        r = requests.post(f"{BASE_URL}/api/tts", json={"text": "no auth"}, timeout=30)
        assert r.status_code in (401, 403), f"unauth should be rejected, got {r.status_code}"
