"""
End-to-End integration test script for Phase 2A Frontend & Backend.
Tests live servers on http://127.0.0.1:8000 and http://127.0.0.1:3000.
"""
import urllib.request
import urllib.error
import json
import time
import sys

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"


def test_servers_alive():
    print("\n--- 1. Testing Live Backend & Frontend Servers ---")
    # Test Backend Health
    try:
        req = urllib.request.urlopen(f"{BACKEND_URL}/health", timeout=5)
        data = json.loads(req.read().decode())
        assert req.status == 200
        assert data["status"] == "ok"
        print(f"[OK] Backend /health is LIVE (HTTP {req.status}):", data)
    except Exception as e:
        print(f"[FAIL] Backend failed: {e}")
        raise

    # Test Frontend Pages
    pages = ["/login", "/register", "/onboarding", "/dashboard", "/schemes", "/eligibility", "/learn", "/ai", "/profile"]
    for p in pages:
        try:
            req = urllib.request.urlopen(f"{FRONTEND_URL}{p}", timeout=5)
            assert req.status == 200
            html = req.read().decode()
            assert "ArthSetu" in html or "arthsetu" in html.lower()
            print(f"[OK] Frontend {p:<14} is LIVE (HTTP {req.status}, HTML size: {len(html)} bytes)")
        except Exception as e:
            print(f"[FAIL] Frontend {p} failed: {e}")
            raise


def test_auth_onboarding_and_api_flow():
    print("\n--- 2. Testing End-to-End Auth, Onboarding & Backend APIs ---")

    # Step A: Register new user
    user_payload = {
        "name": "Ganesh Shinde",
        "phone": "9833445566",
        "email": "ganesh.shinde@example.com",
        "password": "Shinde@Secure123",
        "language_preference": "mr",
        "business_name": "Shinde Agro Foods",
        "business_type": "Food Processing & Spices",
        "location": "Satara, Maharashtra",
        "annual_income": 350000.0,
        "years_in_business": 2,
        "financial_goals": "Get a loan, Expand my business",
    }
    
    # Try login first in case already created
    login_req = urllib.request.Request(
        f"{BACKEND_URL}/api/auth/login",
        data=json.dumps({"phone": "9833445566", "password": "Shinde@Secure123"}).encode(),
        headers={"Content-Type": "application/json"},
    )
    token = None
    user_id = None
    try:
        res = urllib.request.urlopen(login_req)
        data = json.loads(res.read().decode())
        token = data["access_token"]
        user_id = data["user"]["id"]
        print("[OK] User already existed; logged in successfully with JWT token")
    except urllib.error.HTTPError:
        # Register if not exists
        reg_req = urllib.request.Request(
            f"{BACKEND_URL}/api/auth/register",
            data=json.dumps(user_payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        res = urllib.request.urlopen(reg_req)
        assert res.status == 201
        data = json.loads(res.read().decode())
        user_id = data["user"]["id"]
        # In Phase 8A, activate verified status for newly registered test user
        from app.database import SessionLocal
        from app.models.user import User
        with SessionLocal() as db_session:
            u = db_session.query(User).filter(User.id == user_id).first()
            if u:
                u.is_verified = True
                db_session.commit()
        login_res = urllib.request.urlopen(login_req)
        token = json.loads(login_res.read().decode())["access_token"]
        print(f"[OK] Registered & verified new entrepreneur: {data['user']['name']} (ID: {user_id})")

    assert token is not None
    assert user_id is not None

    # Step B: Test /api/auth/me with Bearer token
    me_req = urllib.request.Request(
        f"{BACKEND_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    res_me = urllib.request.urlopen(me_req)
    assert res_me.status == 200
    me_data = json.loads(res_me.read().decode())
    assert me_data["id"] == user_id
    assert me_data["phone"] == "9833445566"
    print(f"[OK] Authenticated /api/auth/me verified: {me_data['name']} (Language: {me_data['language_preference']})")

    # Step C: Test Onboarding / Profile Update
    onboarding_payload = {
        "language_preference": "mr",
        "business_name": "Shinde Organic Jaggery & Flour Mill",
        "location": "Satara District, Maharashtra",
        "annual_income": 400000.0,
        "years_in_business": 3,
        "financial_goals": "Expand my business, Get a loan, Protect my business",
    }
    update_req = urllib.request.Request(
        f"{BACKEND_URL}/api/users/{user_id}",
        data=json.dumps(onboarding_payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="PATCH",
    )
    res_update = urllib.request.urlopen(update_req)
    assert res_update.status == 200
    updated_user = json.loads(res_update.read().decode())
    assert updated_user["business_name"] == "Shinde Organic Jaggery & Flour Mill"
    assert updated_user["years_in_business"] == 3
    print(f"[OK] Onboarding update successful: {updated_user['business_name']}")

    # Step D: Test Schemes Discovery API
    res_schemes = urllib.request.urlopen(f"{BACKEND_URL}/api/schemes")
    assert res_schemes.status == 200
    schemes_data = json.loads(res_schemes.read().decode())
    assert schemes_data["total"] >= 5
    print(f"[OK] Schemes API returned {schemes_data['total']} verified government schemes")

    # Step E: Test Applications API
    app_payload = {
        "user_id": user_id,
        "scheme_id": schemes_data["schemes"][0]["id"],
        "status": "draft",
        "notes": "Initiated draft for Mudra Shishu loan.",
    }
    create_app_req = urllib.request.Request(
        f"{BACKEND_URL}/api/applications",
        data=json.dumps(app_payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    res_app = urllib.request.urlopen(create_app_req)
    assert res_app.status == 201
    app_created = json.loads(res_app.read().decode())
    print(f"[OK] Application created: ID {app_created['id']}, Scheme {app_created['scheme_id']}, Status: {app_created['status']}")

    # Step F: Test User Applications listing
    res_user_apps = urllib.request.urlopen(f"{BACKEND_URL}/api/applications/{user_id}")
    assert res_user_apps.status == 200
    user_apps = json.loads(res_user_apps.read().decode())
    assert len(user_apps) >= 1
    print(f"[OK] User applications listing verified: {len(user_apps)} active application(s)")

    # Step G: Test Progress API
    prog_payload = {
        "user_id": user_id,
        "module_id": "rural-bookkeeping-101",
        "completion_status": "in_progress",
        "completion_percentage": 50.0,
    }
    res_prog = urllib.request.urlopen(
        urllib.request.Request(
            f"{BACKEND_URL}/api/progress",
            data=json.dumps(prog_payload).encode(),
            headers={"Content-Type": "application/json"},
        )
    )
    assert res_prog.status == 201
    print(f"[OK] Learning progress recorded: module {prog_payload['module_id']} at 50%")

    # Step H: Test Notifications API
    notif_payload = {
        "user_id": user_id,
        "title": "Application Draft Saved",
        "message": "Your draft application for PMMY Mudra loan has been saved.",
    }
    res_notif = urllib.request.urlopen(
        urllib.request.Request(
            f"{BACKEND_URL}/api/notifications",
            data=json.dumps(notif_payload).encode(),
            headers={"Content-Type": "application/json"},
        )
    )
    assert res_notif.status == 201
    notif_data = json.loads(res_notif.read().decode())
    print(f"[OK] Notification delivered: '{notif_data['title']}'")

    # Step I: Mark Notification as read
    res_read = urllib.request.urlopen(
        urllib.request.Request(
            f"{BACKEND_URL}/api/notifications/{notif_data['id']}/read",
            data=b"",
            method="PATCH",
        )
    )
    assert res_read.status == 200
    assert json.loads(res_read.read().decode())["read_status"] is True
    print(f"[OK] Notification {notif_data['id']} marked as read successfully")


if __name__ == "__main__":
    test_servers_alive()
    test_auth_onboarding_and_api_flow()
    print("\n==================================================")
    print("ALL PHASE 2A E2E INTEGRATION TESTS PASSED (100% OK)")
    print("==================================================")
