"""
Phase 3 End-to-End Live Integration Test for ArthSetu AI Financial Guidance Assistant.
Tests live servers on http://127.0.0.1:8000 and http://127.0.0.1:3000.
"""
import urllib.request
import urllib.error
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"


def test_servers_and_ai_page():
    print("\n--- 1. Testing Live Backend & AI Frontend Page ---")
    # Backend Health
    req = urllib.request.urlopen(f"{BACKEND_URL}/health", timeout=5)
    assert req.status == 200
    print("[OK] Backend /health is LIVE (HTTP 200)")

    # Frontend /ai Page
    req_ai = urllib.request.urlopen(f"{FRONTEND_URL}/ai", timeout=5)
    assert req_ai.status == 200
    html = req_ai.read().decode("utf-8")
    assert "ArthSetu AI" in html or "arthsetu" in html.lower()
    print(f"[OK] Frontend /ai chat page is LIVE (HTTP 200, {len(html)} bytes)")


def test_ai_endpoint_authentication_and_validation():
    print("\n--- 2. Testing AI Endpoint Security & Validation ---")
    # A. Unauthenticated request must be rejected with 401
    try:
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/ai/chat",
            data=json.dumps({"message": "Which schemes help me?"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req)
        assert False, "Expected 401 Unauthorized for unauthenticated request"
    except urllib.error.HTTPError as err:
        assert err.code == 401
        print(f"[OK] Unauthenticated request correctly rejected with HTTP {err.code}")

    # Authenticate to obtain token
    login_req = urllib.request.Request(
        f"{BACKEND_URL}/api/auth/login",
        data=json.dumps({"phone": "9876543210", "password": "Devi@12345"}).encode(),
        headers={"Content-Type": "application/json"},
    )
    res = urllib.request.urlopen(login_req)
    token = json.loads(res.read().decode())["access_token"]
    assert token is not None
    print("[OK] Obtained authenticated JWT Bearer token")

    # B. Empty message must return 422
    try:
        req_empty = urllib.request.Request(
            f"{BACKEND_URL}/api/ai/chat",
            data=json.dumps({"message": "   "}).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        )
        urllib.request.urlopen(req_empty)
        assert False, "Expected 422 for empty message"
    except urllib.error.HTTPError as err:
        assert err.code == 422
        print(f"[OK] Empty message correctly rejected with HTTP {err.code}")


def test_ai_missing_key_graceful_advisory(token: str = None):
    print("\n--- 3. Testing Missing API Key Advisory Behavior ---")
    if not token:
        login_req = urllib.request.Request(
            f"{BACKEND_URL}/api/auth/login",
            data=json.dumps({"phone": "9876543210", "password": "Devi@12345"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        res = urllib.request.urlopen(login_req)
        token = json.loads(res.read().decode())["access_token"]

    # Call live AI endpoint without configured external key
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/ai/chat",
        data=json.dumps({
            "message": "Which government schemes can help my rural enterprise?",
            "history": [],
            "language": "en",
        }).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    res = urllib.request.urlopen(req)
    assert res.status == 200
    data = json.loads(res.read().decode())
    assert "assistant_message" in data
    assert "disclaimer" in data
    assert len(data["assistant_message"]) > 0

    if "[ArthSetu System Advisory" in data["assistant_message"]:
        print("[OK] Live endpoint gracefully returned development advisory (unconfigured key)")
    else:
        print("[OK] Live endpoint successfully generated real Gemini AI guidance:")
        print("     Snippet:", data["assistant_message"][:120].encode('ascii', 'ignore').decode().replace('\n', ' '))


def test_ai_mock_provider_grounding_and_actions():
    print("\n--- 4. Testing Scheme Grounding and Contextual Actions with Mock Provider ---")
    from app.database import SessionLocal
    from app.models.user import User
    from app.services.ai_provider import MockAIProvider
    from app.services.ai_service import AIService
    from app.schemas.ai import AIChatRequest
    import asyncio

    db = SessionLocal()
    user = db.query(User).filter(User.phone == "9876543210").first()
    assert user is not None

    mock_provider = MockAIProvider(
        "For your business, the Pradhan Mantri Mudra Yojana (PMMY) [SCHEME_ID: 1] provides collateral-free loans "
        "up to ₹10 Lakhs. You can also explore our financial education modules to learn daily bookkeeping."
    )
    service = AIService(provider=mock_provider)

    req = AIChatRequest(
        message="Tell me about Mudra loan and bookkeeping",
        history=[],
        language="en",
    )

    async def run_chat():
        return await service.chat(req, user, db)

    loop = asyncio.new_event_loop()
    response = loop.run_until_complete(run_chat())
    loop.close()
    db.close()

    assert 1 in response.relevant_scheme_ids
    assert len(response.suggested_actions) >= 3

    action_types = [a.type for a in response.suggested_actions]
    assert "view_scheme" in action_types
    assert "check_eligibility" in action_types
    assert "start_learning" in action_types

    print(f"[OK] Grounded response identified Scheme ID(s): {response.relevant_scheme_ids}")
    print(f"[OK] Generated {len(response.suggested_actions)} contextual actions:")
    for a in response.suggested_actions:
        print(f"     - {a.label} -> {a.href} ({a.type})")


if __name__ == "__main__":
    print("==================================================")
    print("STARTING PHASE 3 AI INTEGRATION TEST SUITE")
    print("==================================================")
    test_servers_and_ai_page()
    test_ai_endpoint_authentication_and_validation()
    test_ai_missing_key_graceful_advisory()
    test_ai_mock_provider_grounding_and_actions()
    print("\n==================================================")
    print("ALL PHASE 3 E2E INTEGRATION TESTS PASSED (100% OK)")
    print("==================================================")
