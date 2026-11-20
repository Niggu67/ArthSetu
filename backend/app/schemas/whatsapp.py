from typing import Optional, List
from pydantic import BaseModel, Field


class TwilioWebhookPayload(BaseModel):
    """Schema for incoming WhatsApp webhook payload from Twilio."""
    From: str = Field(..., description="Sender WhatsApp phone number with 'whatsapp:' prefix")
    To: Optional[str] = Field(None, description="Recipient Twilio WhatsApp number")
    Body: str = Field(..., description="Text content of the incoming WhatsApp message")
    MessageSid: Optional[str] = Field(None, description="Unique Twilio message identifier")
    AccountSid: Optional[str] = Field(None, description="Twilio Account SID")
    NumMedia: Optional[str] = Field(None, description="Number of media attachments")
    ProfileName: Optional[str] = Field(None, description="Sender's WhatsApp profile name if provided by Twilio")


class WhatsAppStatusResponse(BaseModel):
    """Status endpoint response for WhatsApp integration health and configuration."""
    status: str
    service: str
    provider: str
    signature_validation_enabled: bool
    public_url_note: str
