import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.services.ai_provider import MockAIProvider
from app.services.ai_service import AIService
from app.services.whatsapp_service import (
    normalize_phone_number,
    resolve_user_context,
    detect_message_language,
    format_whatsapp_message,
    build_twiml_response,
    validate_twilio_signature,
    WhatsAppService,
)
import app.api.whatsapp as whatsapp_module

client = TestClient(app)


def test_normalize_phone_number():
    """Verify phone normalization handles Twilio WhatsApp formats."""
    assert normalize_phone_number("whatsapp:+919876543210") == "9876543210"
    assert normalize_phone_number("+919876543210") == "9876543210"
    assert normalize_phone_number("+91 98765-43210") == "9876543210"
    assert normalize_phone_number("09876543210") == "9876543210"
    assert normalize_phone_number("9876543210") == "9876543210"
    assert normalize_phone_number("") == ""


def test_resolve_user_context_registered_vs_guest():
    """Ensure registered users resolve properly while unlinked numbers get guest context."""
    db = SessionLocal()
    try:
        # 1. Registered user in DB
        registered_user = db.query(User).first()
        assert registered_user is not None
        resolved_user, is_reg = resolve_user_context(registered_user.phone, db)
        assert is_reg is True
        assert resolved_user.id == registered_user.id

        # 2. Unregistered / guest number
        guest_phone = "9111122223"
        resolved_guest, is_guest_reg = resolve_user_context(guest_phone, db)
        assert is_guest_reg is False
        assert resolved_guest.name == "Entrepreneur"
        assert resolved_guest.phone == guest_phone
        assert resolved_guest.id is None  # Not persisted in DB
    finally:
        db.close()


def test_detect_message_language():
    """Verify multi-lingual detection for English, Hindi, and Marathi."""
    assert detect_message_language("How do I apply for Mudra loan?") == "en"
    assert detect_message_language("मला व्यवसायासाठी कर्ज योजनांची माहिती हवी आहे") == "mr"
    assert detect_message_language("मुझे मुद्रा लोन के लिए आवेदन कैसे करना है?") == "hi"
    assert detect_message_language("Please reply in Marathi") == "mr"
    assert detect_message_language("हिंदी में बताएं") == "hi"


def test_format_whatsapp_message():
    """Verify markdown conversion, disclaimer, and guest prompt."""
    raw = "You can apply for **PMMY** on the [Mudra Portal](https://mudra.org.in)."
    formatted = format_whatsapp_message(raw, is_registered=True)

    # Markdown **bold** converted to *bold*
    assert "*PMMY*" in formatted
    # Markdown link converted
    assert "Mudra Portal: https://mudra.org.in" in formatted
    # Financial guidance disclaimer present (not statutory)
    assert "Financial Guidance Disclaimer" in formatted
    assert "guarantee loan sanctions" in formatted

    # Guest user prompt
    guest_formatted = format_whatsapp_message(raw, is_registered=False)
    assert "Register on the ArthSetu web platform" in guest_formatted


def test_build_twiml_response_and_xml_escaping():
    """Verify TwiML structure and XML escaping of dangerous characters."""
    raw_message = "Mudra Loan <50000> & PMEGP > 100000"
    twiml = build_twiml_response(raw_message)

    assert twiml.startswith('<?xml version="1.0" encoding="UTF-8"?>')
    assert "<Response>" in twiml
    assert "<Message>" in twiml
    assert "</Message>" in twiml
    assert "</Response>" in twiml
    # Special characters must be escaped
    assert "&lt;50000&gt;" in twiml
    assert "&amp;" in twiml
    assert "<50000>" not in twiml


def test_validate_twilio_signature_algorithm():
    """Verify official Twilio HMAC-SHA1 signature validation."""
    url = "https://arthsetu.example.com/api/whatsapp/webhook"
    params = {
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": "Tell me about Mudra loan",
    }
    auth_token = "test_auth_token_secret_12345"

    import hmac
    import hashlib
    import base64

    # Calculate correct expected signature manually
    sorted_keys = sorted(params.keys())
    data = url + "".join(f"{k}{params[k]}" for k in sorted_keys)
    mac = hmac.new(auth_token.encode("utf-8"), data.encode("utf-8"), hashlib.sha1)
    correct_sig = base64.b64encode(mac.digest()).decode("utf-8")

    # Correct signature validates
    assert validate_twilio_signature(url, params, correct_sig, auth_token) is True
    # Tampered signature fails
    assert validate_twilio_signature(url, params, "invalid_sig", auth_token) is False
    # Missing auth token fails
    assert validate_twilio_signature(url, params, correct_sig, "") is False


def test_whatsapp_status_endpoint():
    """Verify GET /api/whatsapp/status returns active status and ngrok guidance."""
    res = client.get("/api/whatsapp/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    assert data["service"] == "ArthSetu WhatsApp AI Webhook"
    assert "ngrok" in data["public_url_note"]


def test_whatsapp_webhook_empty_body_welcome():
    """Sending an empty message returns a friendly ArthSetu welcome guide."""
    payload = {
        "From": "whatsapp:+919876543210",
        "Body": "",
    }
    res = client.post("/api/whatsapp/webhook", data=payload)
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert "Welcome to *ArthSetu" in res.text


def test_whatsapp_webhook_with_mock_ai_registered_user(monkeypatch):
    """Verify webhook response for a registered user using MockAIProvider."""
    # Mock AI response
    monkeypatch.setattr(
        "app.api.whatsapp.whatsapp_service.ai_service",
        AIService(
            provider=MockAIProvider(
                "Pradhan Mantri Mudra Yojana (PMMY) [SCHEME_ID: 1] provides up to ₹10 Lakhs without collateral."
            )
        ),
    )

    db = SessionLocal()
    reg_user = db.query(User).first()
    db.close()
    assert reg_user is not None

    payload = {
        "From": f"whatsapp:+91{reg_user.phone}",
        "To": "whatsapp:+14155238886",
        "Body": "Tell me about Mudra loan",
        "MessageSid": "SM1234567890",
    }
    res = client.post("/api/whatsapp/webhook", data=payload)
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert "<Response>" in res.text
    assert "Mudra Yojana" in res.text
    assert "Financial Guidance Disclaimer" in res.text


def test_whatsapp_webhook_with_mock_ai_guest_user(monkeypatch):
    """Verify webhook response for an unknown/guest number using MockAIProvider."""
    monkeypatch.setattr(
        "app.api.whatsapp.whatsapp_service.ai_service",
        AIService(
            provider=MockAIProvider(
                "PMEGP offers margin money subsidies between 15% and 35% for new micro-enterprises."
            )
        ),
    )

    payload = {
        "From": "whatsapp:+919999888877",  # Unknown number
        "To": "whatsapp:+14155238886",
        "Body": "What is PMEGP?",
        "MessageSid": "SM9876543210",
    }
    res = client.post("/api/whatsapp/webhook", data=payload)
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert "PMEGP" in res.text
    # Includes tip to register for guest users
    assert "Register on the ArthSetu web platform" in res.text


def test_whatsapp_webhook_signature_enforcement(monkeypatch):
    """Verify 403 Forbidden is returned when TWILIO_VALIDATE_SIGNATURE is True and signature is invalid."""
    monkeypatch.setattr("app.config.settings.TWILIO_VALIDATE_SIGNATURE", True)
    monkeypatch.setattr("app.config.settings.TWILIO_AUTH_TOKEN", "secret_auth_token_xyz")

    payload = {
        "From": "whatsapp:+919876543210",
        "Body": "Hello",
    }
    headers = {
        "X-Twilio-Signature": "invalid_signature_hash",
    }
    res = client.post("/api/whatsapp/webhook", data=payload, headers=headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Invalid Twilio signature"
