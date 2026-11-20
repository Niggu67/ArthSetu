from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.services.whatsapp_service import (
    WhatsAppService,
    validate_twilio_signature,
)
from app.schemas.whatsapp import WhatsAppStatusResponse

from urllib.parse import parse_qs

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

whatsapp_service = WhatsAppService()


@router.post("/webhook")
async def twilio_whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Twilio WhatsApp Webhook Endpoint.
    Receives incoming WhatsApp messages from Twilio Sandbox / Production numbers.
    Validates Twilio signature if enabled in configuration.
    Returns synchronous TwiML XML to dispatch the AI response back to WhatsApp.
    """
    # Parse incoming urlencoded form data (Twilio standard)
    content_type = request.headers.get("content-type", "")
    form_dict = {}
    if "application/x-www-form-urlencoded" in content_type:
        raw_body = await request.body()
        parsed = parse_qs(raw_body.decode("utf-8"), keep_blank_values=True)
        form_dict = {k: v[0] if isinstance(v, list) and len(v) > 0 else "" for k, v in parsed.items()}
    else:
        try:
            form_data = await request.form()
            form_dict = {key: str(value) for key, value in form_data.items()}
        except Exception:
            raw_body = await request.body()
            parsed = parse_qs(raw_body.decode("utf-8"), keep_blank_values=True)
            form_dict = {k: v[0] if isinstance(v, list) and len(v) > 0 else "" for k, v in parsed.items()}

    # Optional signature validation for production / secure staging
    if settings.TWILIO_VALIDATE_SIGNATURE:
        signature = request.headers.get("X-Twilio-Signature")
        # Build full incoming URL including protocol and host
        url = str(request.url)
        is_valid = validate_twilio_signature(
            url=url,
            post_params=form_dict,
            signature=signature,
            auth_token=settings.TWILIO_AUTH_TOKEN,
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Twilio signature",
            )

    # Process message and generate TwiML response
    twiml_xml = await whatsapp_service.process_incoming_webhook(form_dict, db)

    return Response(
        content=twiml_xml,
        media_type="application/xml",
        status_code=status.HTTP_200_OK,
    )


@router.get("/status", response_model=WhatsAppStatusResponse)
def get_whatsapp_status():
    """
    Status and configuration verification endpoint for ArthSetu WhatsApp integration.
    Includes guidance note on public HTTPS URL requirements (ngrok) for Twilio.
    """
    return WhatsAppStatusResponse(
        status="active",
        service="ArthSetu WhatsApp AI Webhook",
        provider=settings.AI_PROVIDER,
        signature_validation_enabled=settings.TWILIO_VALIDATE_SIGNATURE,
        public_url_note=(
            "To receive live WhatsApp messages from Twilio in local development, "
            "expose your local backend via an HTTPS tunnel (e.g. ngrok http 8000) and set "
            "the Twilio WhatsApp Sandbox webhook to https://<your-tunnel>.ngrok-free.app/api/whatsapp/webhook"
        ),
    )
