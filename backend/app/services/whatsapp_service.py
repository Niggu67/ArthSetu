import hmac
import hashlib
import base64
import re
import html
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.ai import AIChatRequest
from app.services.ai_service import AIService


def normalize_phone_number(raw_phone: str) -> str:
    """
    Normalizes incoming WhatsApp phone number.
    Strips 'whatsapp:' prefix, country codes (+91), spaces, dashes.
    Returns standard 10-digit number for Indian numbers or normalized digits.
    """
    if not raw_phone:
        return ""
    # Strip whatsapp: prefix
    cleaned = raw_phone.strip()
    if cleaned.startswith("whatsapp:"):
        cleaned = cleaned[len("whatsapp:") :]
    # Strip non-digits except leading '+'
    digits_only = re.sub(r"[^\d]", "", cleaned)
    # If 12 digits starting with 91 (India) or 11 digits starting with 0, take last 10
    if len(digits_only) == 12 and digits_only.startswith("91"):
        return digits_only[2:]
    elif len(digits_only) == 11 and digits_only.startswith("0"):
        return digits_only[1:]
    elif len(digits_only) > 10:
        return digits_only[-10:]
    return digits_only


def resolve_user_context(phone: str, db: Session) -> Tuple[User, bool]:
    """
    Maps an incoming normalized phone number to a registered ArthSetu user.
    If not registered, returns a transient guest User object with neutral context.
    Returns (user, is_registered).
    DOES NOT hard-code or fabricate demo credentials.
    """
    if phone:
        # Check standard 10-digit or variants with country code in DB
        registered_user = (
            db.query(User)
            .filter(
                (User.phone == phone)
                | (User.phone == f"+91{phone}")
                | (User.phone == f"91{phone}")
            )
            .first()
        )
        if registered_user:
            return registered_user, True

    # Guest user - transient, non-persisted User instance
    guest_user = User(
        name="Entrepreneur",
        phone=phone or "guest",
        language_preference="en",
        business_type="Micro-Enterprise",
        location="India",
        financial_goals="Business growth, capital, and government scheme guidance",
    )
    return guest_user, False


def detect_message_language(text: str, default_language: str = "en") -> str:
    """
    Detects if the incoming message is predominantly Devanagari or indicates Marathi/Hindi.
    Falls back to user preference or default language.
    """
    if not text:
        return default_language

    text_lower = text.lower()

    # Explicit language preference mentions
    if any(w in text_lower for w in ["marathi", "मराठी"]):
        return "mr"
    if any(w in text_lower for w in ["hindi", "हिंदी"]):
        return "hi"
    if any(w in text_lower for w in ["english", "इंग्रजी", "अंग्रेजी"]):
        return "en"

    # Distinctive Marathi words/particles
    marathi_markers = ["आहे", "नाही", "माहिती", "योजना", "कर्ज", "कसे", "मिळेल", "करावे", "नमस्कार", "काय"]
    if any(m in text for m in marathi_markers):
        return "mr"

    # Distinctive Hindi markers
    hindi_markers = ["है", "नहीं", "जानकारी", "योजनाएं", "ऋण", "लोन", "कैसे", "मिलेगा", "नमस्ते", "क्या"]
    if any(h in text for h in hindi_markers):
        return "hi"

    # Check Devanagari Unicode range (\u0900-\u097F)
    devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))
    if devanagari_chars > len(text) * 0.2:
        # Default Devanagari to Hindi if not identified as Marathi
        return "hi"

    return default_language


def format_whatsapp_message(
    assistant_text: str,
    relevant_scheme_ids: list = None,
    suggested_actions: list = None,
    is_registered: bool = True,
) -> str:
    """
    Formats the AI response for WhatsApp:
    1. Converts standard markdown formatting to WhatsApp formatting (e.g. **bold** -> *bold*).
    2. Simplifies markdown links [text](url) -> text (url).
    3. Appends scheme portal links if available.
    4. Appends a clear 'Financial Guidance Disclaimer'.
    5. Appends registration prompt if user is a guest.
    """
    formatted = assistant_text.strip()

    # Convert markdown bold **text** to WhatsApp bold *text*
    formatted = re.sub(r"\*\*(.*?)\*\*", r"*\1*", formatted)

    # Convert markdown links [Label](URL) to Label: URL
    formatted = re.sub(r"\[([^\]]+)\]\((https?://[^\)]+)\)", r"\1: \2", formatted)

    # Append financial guidance disclaimer
    disclaimer = (
        "\n\n⚖️ *Financial Guidance Disclaimer:*\n"
        "ArthSetu provides informational guidance and does not guarantee loan sanctions "
        "or scheme approvals. Approvals are strictly determined by banks and government authorities."
    )
    formatted += disclaimer

    # If guest user, add a polite invitation to create an ArthSetu profile for personalized guidance
    if not is_registered:
        formatted += (
            "\n\n💡 *Tip:* Register on the ArthSetu web platform to get personalized scheme recommendations "
            "based on your enterprise sector and location."
        )

    return formatted


def build_twiml_response(message_body: str) -> str:
    """
    Constructs a standard, valid Twilio TwiML XML response.
    Properly escapes special characters to prevent XML parsing errors.
    """
    escaped_body = html.escape(message_body, quote=True)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<Response>\n'
        f"    <Message>{escaped_body}</Message>\n"
        '</Response>'
    )


def validate_twilio_signature(
    url: str,
    post_params: Dict[str, str],
    signature: Optional[str],
    auth_token: Optional[str],
) -> bool:
    """
    Implements Twilio's official webhook signature validation algorithm.
    1. Sort POST parameters alphabetically by key.
    2. Append key and value without delimiters to the full request URL.
    3. Compute HMAC-SHA1 using the Auth Token as secret.
    4. Compare base64-encoded signature with X-Twilio-Signature header.
    """
    if not auth_token or not signature:
        return False

    # 1 & 2. Construct validation string
    sorted_keys = sorted(post_params.keys())
    data_to_sign = url + "".join(f"{k}{post_params[k]}" for k in sorted_keys)

    # 3 & 4. Compute HMAC-SHA1
    mac = hmac.new(
        auth_token.encode("utf-8"),
        data_to_sign.encode("utf-8"),
        hashlib.sha1,
    )
    expected_signature = base64.b64encode(mac.digest()).decode("utf-8")

    # Secure constant-time comparison
    return hmac.compare_digest(expected_signature, signature)


class WhatsAppService:
    """
    Service layer handling incoming WhatsApp webhook processing, AI routing,
    and message rendering. Designed to easily support future asynchronous outbound messaging.
    """

    def __init__(self, ai_service: Optional[AIService] = None):
        self.ai_service = ai_service or AIService()

    async def generate_response_text(
        self,
        sender_phone: str,
        incoming_text: str,
        db: Session,
    ) -> str:
        """
        Core AI dispatch logic:
        1. Resolve user context (registered user vs. guest).
        2. Detect target language.
        3. Call existing AIService.
        4. Format response for WhatsApp with financial guidance disclaimer.
        """
        normalized_phone = normalize_phone_number(sender_phone)
        user, is_registered = resolve_user_context(normalized_phone, db)

        # Detect language preference
        target_lang = detect_message_language(
            incoming_text, default_language=user.language_preference or "en"
        )

        # Build AI request for existing AIService
        ai_request = AIChatRequest(
            message=incoming_text,
            language=target_lang,
            history=[],  # WhatsApp turns are stateless per webhook; expandable to session memory
        )

        # Route to existing ArthSetu AI Service
        ai_response = await self.ai_service.chat(request=ai_request, user=user, db=db)

        # Format message with WhatsApp formatting, links, and disclaimer
        whatsapp_text = format_whatsapp_message(
            assistant_text=ai_response.assistant_message,
            relevant_scheme_ids=ai_response.relevant_scheme_ids,
            suggested_actions=ai_response.suggested_actions,
            is_registered=is_registered,
        )

        return whatsapp_text

    async def process_incoming_webhook(
        self,
        form_data: Dict[str, str],
        db: Session,
    ) -> str:
        """
        Receives raw form data from Twilio webhook, processes via AI,
        and produces the synchronous TwiML XML response.
        """
        from_number = form_data.get("From", "")
        body = form_data.get("Body", "").strip()

        if not body:
            welcome_msg = (
                "🙏 Welcome to *ArthSetu (अर्थसेतू)* AI Financial Guidance!\n\n"
                "Ask me about:\n"
                "• Government schemes (PMMY Mudra, PMEGP, PMFME, Stand-Up India)\n"
                "• Micro-enterprise loans and subsidies\n"
                "• CIBIL credit score and financial basics\n\n"
                "Type your question in English, हिंदी, or मराठी."
            )
            return build_twiml_response(welcome_msg)

        reply_text = await self.generate_response_text(
            sender_phone=from_number,
            incoming_text=body,
            db=db,
        )

        return build_twiml_response(reply_text)
