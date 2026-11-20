import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import create_access_token
from app.services.ai_provider import MockAIProvider
from app.services.ai_service import AIService, find_relevant_schemes
from app.schemas.ai import AIChatRequest, ChatMessage
import app.api.ai as ai_module

client = TestClient(app)


@pytest.fixture
def auth_headers():
    db = SessionLocal()
    user = db.query(User).filter(User.phone == "9876543210").first()
    db.close()
    assert user is not None, "Demo user must exist in database"
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_ai_chat_requires_authentication():
    """Unauthenticated requests must be rejected with 401."""
    res = client.post("/api/ai/chat", json={"message": "Hello"})
    assert res.status_code == 401
    assert "detail" in res.json()


def test_ai_chat_validates_empty_message(auth_headers):
    """Empty or whitespace-only messages must return 422 validation error."""
    res = client.post("/api/ai/chat", json={"message": "   "}, headers=auth_headers)
    assert res.status_code == 422


def test_ai_chat_structured_response_with_mock_provider(auth_headers, monkeypatch):
    """Test AI chat response format with Mock provider."""
    # Monkeypatch get_ai_provider in ai_module / ai_service
    monkeypatch.setattr(
        "app.services.ai_service.get_ai_provider",
        lambda: MockAIProvider(
            "Pradhan Mantri Mudra Yojana (PMMY) [SCHEME_ID: 1] offers loans up to ₹10 Lakhs. "
            "It also helps to learn daily bookkeeping."
        ),
    )

    payload = {
        "message": "Tell me about Mudra loan and how to improve credit score",
        "history": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! How can I help?"},
        ],
        "language": "en",
    }
    res = client.post("/api/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert "assistant_message" in data
    assert "relevant_scheme_ids" in data
    assert 1 in data["relevant_scheme_ids"]
    assert "suggested_actions" in data
    assert len(data["suggested_actions"]) >= 2

    action_types = [a["type"] for a in data["suggested_actions"]]
    assert "view_scheme" in action_types
    assert "check_eligibility" in action_types
    assert "start_learning" in action_types

    assert "disclaimer" in data
    assert "ArthSetu AI provides general financial information" in data["disclaimer"]


def test_find_relevant_schemes_selective_retrieval():
    """Verify that find_relevant_schemes retrieves a targeted subset rather than the entire database."""
    db = SessionLocal()
    try:
        # 1. Query specifically about Mudra / loans
        mudra_matches = find_relevant_schemes("I need a Mudra loan for my small shop", db, limit=2)
        assert len(mudra_matches) > 0
        assert any("mudra" in s.name.lower() for s in mudra_matches)

        # 2. Query specifically about food processing / PMFME
        food_matches = find_relevant_schemes("I run a mini flour mill and spice unit", db, limit=2)
        assert len(food_matches) > 0
        assert any("pmfme" in s.name.lower() or "food processing" in s.category.lower() for s in food_matches)

        # 3. Unrelated query returns empty or fallback subset, not all schemes
        nonsense_matches = find_relevant_schemes("what is the weather today?", db, limit=2)
        assert len(nonsense_matches) == 0
    finally:
        db.close()


def test_missing_api_key_returns_labeled_advisory(auth_headers, monkeypatch):
    """When API key is missing, return a clearly labeled development advisory message instead of crashing."""
    # Force settings to have no keys
    monkeypatch.setattr("app.config.settings.AI_PROVIDER", "gemini")
    monkeypatch.setattr("app.config.settings.GEMINI_API_KEY", None)

    res = client.post("/api/ai/chat", json={"message": "Which schemes help me?"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "[ArthSetu System Advisory: AI provider API key is not configured]" in data["assistant_message"]
    assert "GEMINI_API_KEY" in data["assistant_message"]
