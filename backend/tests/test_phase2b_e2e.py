"""
End-to-End integration test script for Phase 2B Frontend & Backend features.
Tests live servers on http://127.0.0.1:8000 and http://127.0.0.1:3000.
"""
import urllib.request
import urllib.error
import json
import sys

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"


def test_frontend_routes():
    print("\n--- 1. Testing Phase 2B Frontend Routes (HTTP 200) ---")
    routes = [
        "/",
        "/schemes",
        "/schemes/1",
        "/eligibility",
        "/applications",
        "/learn",
        "/dashboard",
    ]
    for r in routes:
        url = f"{FRONTEND_URL}{r}"
        try:
            req = urllib.request.urlopen(url, timeout=10)
            assert req.status == 200, f"Expected 200 for {r}, got {req.status}"
            html = req.read().decode("utf-8")
            assert "ArthSetu" in html or "arthsetu" in html.lower()
            print(f"[OK] Route {r:<16} is LIVE (HTTP {req.status}, {len(html)} bytes)")
        except Exception as e:
            print(f"[FAIL] Route {r} failed: {e}")
            raise


def test_schemes_api():
    print("\n--- 2. Testing Schemes Explorer & Details Backend APIs ---")
    # List schemes
    res = urllib.request.urlopen(f"{BACKEND_URL}/api/schemes")
    assert res.status == 200
    data = json.loads(res.read().decode())
    assert data["total"] >= 5
    scheme1 = data["schemes"][0]
    print(f"[OK] Schemes list: retrieved {data['total']} schemes. Sample: '{scheme1['name']}' (ID: {scheme1['id']})")

    # Scheme details
    res_detail = urllib.request.urlopen(f"{BACKEND_URL}/api/schemes/{scheme1['id']}")
    assert res_detail.status == 200
    detail = json.loads(res_detail.read().decode())
    assert detail["id"] == scheme1["id"]
    assert "eligibility_criteria" in detail
    assert "benefits" in detail
    print(f"[OK] Scheme details: successfully fetched criteria & benefits for '{detail['name']}'")

    # Scheme 404 test
    try:
        urllib.request.urlopen(f"{BACKEND_URL}/api/schemes/9999")
        assert False, "Expected 404 for invalid scheme ID"
    except urllib.error.HTTPError as err:
        assert err.code == 404
        print("[OK] Scheme details 404 behavior verified for non-existent ID")


def test_eligibility_api():
    print("\n--- 3. Testing Eligibility Checker API Contract ---")
    payload = {
        "business_type": "Food Processing & Small Mills",
        "annual_income": 350000.0,
        "years_in_business": 2,
        "location": "Satara, Maharashtra",
        "gender": "female",
        "social_category": "OBC",
    }
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/eligibility",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    res = urllib.request.urlopen(req)
    assert res.status == 200
    data = json.loads(res.read().decode())
    assert "overall_eligibility_score" in data
    assert "potentially_eligible_schemes" in data
    assert len(data["potentially_eligible_schemes"]) > 0

    first_match = data["potentially_eligible_schemes"][0]
    assert "eligibility_score" in first_match
    assert "scheme_id" in first_match
    assert "scheme_name" in first_match
    print(
        f"[OK] Eligibility evaluation: overall score={data['overall_eligibility_score']}%, "
        f"matched {len(data['potentially_eligible_schemes'])} schemes. "
        f"Top match '{first_match['scheme_name']}' score={first_match['eligibility_score']}%"
    )


def test_application_tracker_lifecycle():
    print("\n--- 4. Testing Application Tracker Lifecycle ---")
    # 1. Login existing user or register
    login_req = urllib.request.Request(
        f"{BACKEND_URL}/api/auth/login",
        data=json.dumps({"phone": "9876543210", "password": "Devi@12345"}).encode(),
        headers={"Content-Type": "application/json"},
    )
    res_login = urllib.request.urlopen(login_req)
    auth_data = json.loads(res_login.read().decode())
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]
    print(f"[OK] Authenticated user {user_id} for application tracker")

    # 2. Create Application
    create_payload = {
        "user_id": user_id,
        "scheme_id": 1,
        "status": "draft",
        "notes": "E2E Test Phase 2B Draft Tracking Entry",
    }
    req_create = urllib.request.Request(
        f"{BACKEND_URL}/api/applications",
        data=json.dumps(create_payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    res_create = urllib.request.urlopen(req_create)
    assert res_create.status == 201
    app_data = json.loads(res_create.read().decode())
    app_id = app_data["id"]
    assert app_data["status"] == "draft"
    print(f"[OK] Created application ID {app_id} with status 'draft'")

    # 3. Update Application Status
    update_payload = {
        "status": "submitted",
        "notes": "Submitted physical dossier to local bank branch.",
    }
    req_update = urllib.request.Request(
        f"{BACKEND_URL}/api/applications/{app_id}",
        data=json.dumps(update_payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="PATCH",
    )
    res_update = urllib.request.urlopen(req_update)
    assert res_update.status == 200
    updated_data = json.loads(res_update.read().decode())
    assert updated_data["status"] == "submitted"
    print(f"[OK] Updated application ID {app_id} status to 'submitted'")

    # 4. Fetch User Applications List
    req_list = urllib.request.Request(
        f"{BACKEND_URL}/api/applications/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    res_list = urllib.request.urlopen(req_list)
    assert res_list.status == 200
    apps_list = json.loads(res_list.read().decode())
    assert any(a["id"] == app_id for a in apps_list)
    print(f"[OK] Verified user has {len(apps_list)} tracked application(s)")


def test_learning_progress_lifecycle():
    print("\n--- 5. Testing Financial Learning Progress API Lifecycle ---")
    user_id = 1
    modules = ["rural-bookkeeping-101", "pmmy-mudra-guide", "working-capital-mfi"]
    
    for mod in modules:
        prog_payload = {
            "user_id": user_id,
            "module_id": mod,
            "completion_status": "completed",
            "completion_percentage": 100.0,
        }
        req_prog = urllib.request.Request(
            f"{BACKEND_URL}/api/progress",
            data=json.dumps(prog_payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        res_prog = urllib.request.urlopen(req_prog)
        assert res_prog.status in [200, 201]
        print(f"[OK] Marked module '{mod}' as completed (100%)")

    # Fetch progress
    res_get = urllib.request.urlopen(f"{BACKEND_URL}/api/progress/{user_id}")
    assert res_get.status == 200
    saved_progress = json.loads(res_get.read().decode())
    assert len(saved_progress) >= len(modules)
    completed_modules = [p["module_id"] for p in saved_progress if p.get("completion_percentage", 0) == 100.0]
    print(f"[OK] User progress verified: {len(completed_modules)} completed modules recorded in database")


if __name__ == "__main__":
    print("==================================================")
    print("STARTING PHASE 2B FULL INTEGRATION TEST SUITE")
    print("==================================================")
    test_frontend_routes()
    test_schemes_api()
    test_eligibility_api()
    test_application_tracker_lifecycle()
    test_learning_progress_lifecycle()
    print("\n==================================================")
    print("ALL PHASE 2B E2E INTEGRATION TESTS PASSED (100% OK)")
    print("==================================================")
