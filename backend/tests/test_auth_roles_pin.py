"""Backend tests for new role/PIN auth flows: teen self sign-up, age gate,
parent PIN set/verify, /auth/me has_pin field, Bearer token auth."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip()
                break
API = f"{BASE_URL.rstrip('/')}/api"

DEMO_EMAIL = "parent@brighterdayz.org"
DEMO_PASS = "Sunshine123"
DEMO_PIN = "2468"


def _bearer(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Teen self sign-up + age gate ----------
class TestTeenRegister:
    def test_teen_under_13_blocked(self):
        email = f"test_teen_u13_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "Tiny", "email": email, "password": "Sunshine123",
            "role": "teen", "age": 10}, timeout=15)
        assert r.status_code == 400, r.text
        assert "parent" in r.json()["detail"].lower() or "guardian" in r.json()["detail"].lower()

    def test_teen_13_plus_creates_account_and_child(self):
        email = f"test_teen_ok_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "Teen Tess", "email": email, "password": "Sunshine123",
            "role": "teen", "age": 14}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["role"] == "teen"
        assert data["child_id"], "teen registration should auto-create child profile"
        assert data["has_pin"] is False
        assert data["token"], "should return Bearer token"
        # Use bearer token to fetch /auth/me
        me = requests.get(f"{API}/auth/me", headers=_bearer(data["token"]), timeout=15).json()
        assert me["role"] == "teen"
        assert me["has_pin"] is False
        # The auto-created child should be listed for this account
        kids = requests.get(f"{API}/children", headers=_bearer(data["token"]), timeout=15).json()
        ids = [c["id"] for c in kids]
        assert data["child_id"] in ids

    def test_teen_age_missing_blocked(self):
        email = f"test_teen_noage_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "NoAge", "email": email, "password": "Sunshine123",
            "role": "teen"}, timeout=15)
        assert r.status_code == 400


# ---------- Parent PIN flows ----------
@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("token"), "login should return Bearer token"
    return body["token"]


class TestPinDemoParent:
    def test_login_returns_token_and_has_pin_field(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and "has_pin" in body

    def test_ensure_demo_pin_is_2468(self, demo_token):
        # Set/normalize demo parent PIN to 2468 (idempotent)
        r = requests.post(f"{API}/auth/set-pin", json={"pin": DEMO_PIN},
                         headers=_bearer(demo_token), timeout=15)
        assert r.status_code == 200, r.text
        me = requests.get(f"{API}/auth/me", headers=_bearer(demo_token), timeout=15).json()
        assert me["has_pin"] is True

    def test_verify_pin_correct(self, demo_token):
        r = requests.post(f"{API}/auth/verify-pin", json={"pin": DEMO_PIN},
                         headers=_bearer(demo_token), timeout=15)
        assert r.status_code == 200

    def test_verify_pin_wrong(self, demo_token):
        r = requests.post(f"{API}/auth/verify-pin", json={"pin": "0000"},
                         headers=_bearer(demo_token), timeout=15)
        assert r.status_code == 401

    def test_set_pin_invalid(self, demo_token):
        for bad in ["abc", "12", "1234567"]:
            r = requests.post(f"{API}/auth/set-pin", json={"pin": bad},
                             headers=_bearer(demo_token), timeout=15)
            assert r.status_code == 400, f"PIN '{bad}' should be rejected"


# ---------- Fresh parent without PIN ----------
class TestFreshParentNoPin:
    def test_register_parent_no_pin(self):
        email = f"test_parent_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST Parent", "email": email, "password": "Sunshine123",
            "role": "parent"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "parent"
        assert body["has_pin"] is False
        assert body["child_id"] is None
        assert body["token"]
        me = requests.get(f"{API}/auth/me", headers=_bearer(body["token"]), timeout=15).json()
        assert me["has_pin"] is False


# ---------- Bearer auth required ----------
class TestBearerAuth:
    def test_set_pin_unauth(self):
        r = requests.post(f"{API}/auth/set-pin", json={"pin": "1234"}, timeout=15)
        assert r.status_code == 401

    def test_verify_pin_unauth(self):
        r = requests.post(f"{API}/auth/verify-pin", json={"pin": "1234"}, timeout=15)
        assert r.status_code == 401
