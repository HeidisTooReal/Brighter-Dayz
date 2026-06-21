"""Iteration-7 regression: optimized /parent/overview, /parent/alerts, public
legal pages, and safety_monitor wiring on chat."""
import os
import time
import uuid
import requests
import pytest

with open('/app/frontend/.env') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            break
API = f"{BASE_URL}/api"

DEMO_EMAIL = "parent@brighterdayz.org"
DEMO_PASS = "Sunshine123"


@pytest.fixture(scope="module")
def parent():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200
    return s


@pytest.fixture(scope="module")
def kid(parent):
    r = parent.post(f"{API}/children", json={"name": "TEST Iter7", "age": 9, "avatar": "lamb"}, timeout=15)
    assert r.status_code == 200
    c = r.json()
    yield c
    parent.delete(f"{API}/children/{c['id']}", timeout=15)


def test_public_privacy_terms_pages():
    """Public SPA routes must return 200 (no auth)."""
    for path in ["/privacy", "/terms"]:
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"


def test_overview_shape_and_unread_alerts(parent, kid):
    """Optimized overview returns children[] with mood/activity counts and unread_alerts int."""
    # seed one mood + one activity for the test child
    parent.post(f"{API}/children/{kid['id']}/moods", json={"mood": "happy"}, timeout=15)
    parent.post(f"{API}/children/{kid['id']}/activities",
                json={"type": "prayer", "detail": "TEST"}, timeout=15)

    r = parent.get(f"{API}/parent/overview", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "children" in data and "unread_alerts" in data
    assert isinstance(data["unread_alerts"], int)
    match = next((c for c in data["children"] if c["child"]["id"] == kid["id"]), None)
    assert match is not None
    assert match["mood_count"] >= 1
    assert match["activity_count"] >= 1
    assert match["last_mood"] is not None
    assert match["last_mood"]["mood"] == "happy"


def test_parent_alerts_endpoint_returns_list(parent):
    r = parent.get(f"{API}/parent/alerts", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_safety_monitor_creates_parent_alert_on_alarming_chat(parent, kid):
    """Sending an alarming chat to Sunny should asynchronously create a parent alert."""
    before = parent.get(f"{API}/parent/alerts", timeout=15).json()
    before_n = len(before)

    with parent.post(f"{API}/children/{kid['id']}/chat",
                     json={"message": "i want to hurt myself"},
                     timeout=90, stream=True) as r:
        assert r.status_code == 200
        for _ in r.iter_content(chunk_size=None):
            pass  # drain

    # safety_monitor is fired as a background task; poll up to ~30s
    matched = None
    for _ in range(30):
        time.sleep(1.0)
        alerts = parent.get(f"{API}/parent/alerts", timeout=15).json()
        if len(alerts) > before_n:
            # newest alert should reference our child
            matched = next((a for a in alerts if a.get("child_id") == kid["id"]), None)
            if matched:
                break
    assert matched is not None, "No safety alert was created for alarming chat message"
    # overview should also reflect unread_alerts > 0
    ov = parent.get(f"{API}/parent/overview", timeout=15).json()
    assert ov["unread_alerts"] >= 1
