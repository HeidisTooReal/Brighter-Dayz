"""Backend regression tests for Brighter Dayz API.

Covers: auth (register/login/me/logout), children CRUD, moods + rewards/stars,
activities, daily content, affirmation generate, story generate + save, chat
(streaming) + history, TTS, parent overview, and authorization isolation.
"""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # fall back to frontend .env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break
API = f"{BASE_URL}/api"

DEMO_EMAIL = "parent@brighterdayz.org"
DEMO_PASS = "Sunshine123"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def parent_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies, "auth cookie not set"
    return s


@pytest.fixture(scope="session")
def second_parent():
    """Register a second parent for authorization-isolation tests."""
    s = requests.Session()
    email = f"test_other_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "TEST Other", "email": email, "password": "Sunshine123"}, timeout=30)
    assert r.status_code == 200, r.text
    return s, email


@pytest.fixture(scope="session")
def child(parent_session):
    r = parent_session.post(f"{API}/children", json={"name": "TEST Kid", "age": 8, "avatar": "lamb"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    # teardown
    try:
        parent_session.delete(f"{API}/children/{data['id']}", timeout=15)
    except Exception:
        pass


# ---------- auth ----------
class TestAuth:
    def test_login_demo(self, parent_session):
        r = parent_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert data["role"] == "parent"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_register_then_me(self):
        s = requests.Session()
        email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={"name": "TEST Reg", "email": email, "password": "Sunshine123"}, timeout=15)
        assert r.status_code == 200, r.text
        assert "access_token" in s.cookies
        me = s.get(f"{API}/auth/me", timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == email
        # logout
        out = s.post(f"{API}/auth/logout", timeout=15)
        assert out.status_code == 200

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register",
                          json={"name": "Demo", "email": DEMO_EMAIL, "password": "Sunshine123"}, timeout=15)
        assert r.status_code == 400


# ---------- daily ----------
class TestDaily:
    def test_daily_public(self):
        r = requests.get(f"{API}/daily", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "verse" in data and "text" in data["verse"] and "ref" in data["verse"]
        assert "affirmation" in data and isinstance(data["affirmation"], str)


# ---------- children CRUD ----------
class TestChildren:
    def test_create_and_list(self, parent_session, child):
        assert child["id"]
        assert child["name"] == "TEST Kid"
        assert child["age"] == 8
        assert child["stars"] == 0
        r = parent_session.get(f"{API}/children", timeout=15)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert child["id"] in ids

    def test_get_child(self, parent_session, child):
        r = parent_session.get(f"{API}/children/{child['id']}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == child["id"]

    def test_other_parent_cannot_access(self, second_parent, child):
        s, _ = second_parent
        r = s.get(f"{API}/children/{child['id']}", timeout=15)
        assert r.status_code == 404


# ---------- moods + rewards ----------
class TestMoods:
    def test_log_mood_awards_stars(self, parent_session, child):
        before = parent_session.get(f"{API}/children/{child['id']}", timeout=15).json()
        before_stars = before.get("stars", 0)
        r = parent_session.post(f"{API}/children/{child['id']}/moods",
                                json={"mood": "grateful", "note": "TEST"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["mood"]["mood"] == "grateful"
        assert body["child"]["stars"] >= before_stars + 2

    def test_list_moods(self, parent_session, child):
        # add a second mood so chart threshold (2+) works
        parent_session.post(f"{API}/children/{child['id']}/moods", json={"mood": "okay"}, timeout=15)
        r = parent_session.get(f"{API}/children/{child['id']}/moods", timeout=15)
        assert r.status_code == 200
        moods = r.json()
        assert len(moods) >= 2


# ---------- activities ----------
class TestActivities:
    def test_log_activity(self, parent_session, child):
        r = parent_session.post(f"{API}/children/{child['id']}/activities",
                                json={"type": "breathing", "detail": "4-7-8"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert body["child"]["stars"] >= 3

    def test_list_activities(self, parent_session, child):
        r = parent_session.get(f"{API}/children/{child['id']}/activities", timeout=15)
        assert r.status_code == 200
        acts = r.json()
        assert any(a["type"] == "breathing" for a in acts)

    def test_rewards(self, parent_session, child):
        r = parent_session.get(f"{API}/children/{child['id']}/rewards", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "stars" in data and "badges" in data and "all_badges" in data


# ---------- AI affirmation ----------
class TestAffirmation:
    def test_generate(self, parent_session):
        r = parent_session.post(f"{API}/affirmation/generate",
                                json={"age": 8, "feeling": "nervous"}, timeout=60)
        assert r.status_code == 200, r.text
        text = r.json().get("affirmation", "")
        assert isinstance(text, str) and len(text) > 5


# ---------- AI story ----------
class TestStory:
    def test_generate_biblical_and_save(self, parent_session, child):
        r = parent_session.post(f"{API}/story/generate",
                                json={"kind": "biblical", "topic": "courage", "age": 8}, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] and data["body"]
        # save
        sv = parent_session.post(f"{API}/children/{child['id']}/stories/save",
                                 json=data, timeout=15)
        assert sv.status_code == 200
        # list contains it
        lst = parent_session.get(f"{API}/children/{child['id']}/stories", timeout=15)
        assert lst.status_code == 200
        titles = [s["title"] for s in lst.json()]
        assert data["title"] in titles


# ---------- Chat streaming ----------
class TestChat:
    def test_chat_stream_and_history(self, parent_session, child):
        with parent_session.post(f"{API}/children/{child['id']}/chat",
                                 json={"message": "Hi Sunny, I felt nervous today."},
                                 timeout=90, stream=True) as r:
            assert r.status_code == 200, r.text
            chunks = []
            for c in r.iter_content(chunk_size=None):
                if c:
                    chunks.append(c.decode("utf-8", errors="ignore"))
            full = "".join(chunks)
            assert len(full.strip()) > 0
        # allow async save to flush
        time.sleep(1.0)
        h = parent_session.get(f"{API}/children/{child['id']}/chat/history", timeout=15)
        assert h.status_code == 200
        msgs = h.json()
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles


# ---------- TTS ----------
class TestTTS:
    def test_tts_basic(self, parent_session):
        r = parent_session.post(f"{API}/tts",
                                json={"text": "You are loved.", "voice": "coral"}, timeout=60)
        assert r.status_code == 200, r.text
        audio = r.json().get("audio", "")
        assert audio.startswith("data:audio/mp3;base64,")
        assert len(audio) > 100

    def test_tts_empty_text(self, parent_session):
        r = parent_session.post(f"{API}/tts", json={"text": "  "}, timeout=15)
        assert r.status_code == 400


# ---------- Parent overview ----------
class TestParentOverview:
    def test_overview(self, parent_session, child):
        r = parent_session.get(f"{API}/parent/overview", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "children" in data
        ids = [c["child"]["id"] for c in data["children"]]
        assert child["id"] in ids
        match = next(c for c in data["children"] if c["child"]["id"] == child["id"])
        assert match["mood_count"] >= 2
        assert match["activity_count"] >= 1


# ---------- Authorization isolation ----------
class TestAuthorization:
    def test_unauth_endpoints(self):
        for path in ["/children", "/parent/overview"]:
            r = requests.get(f"{API}{path}", timeout=15)
            assert r.status_code == 401

    def test_cannot_post_mood_for_other_parent_child(self, second_parent, child):
        s, _ = second_parent
        r = s.post(f"{API}/children/{child['id']}/moods", json={"mood": "okay"}, timeout=15)
        assert r.status_code == 404
