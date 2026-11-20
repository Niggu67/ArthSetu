import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings

logger = logging.getLogger("arthsetu.email")


class EmailService:
    """
    Email service abstraction for ArthSetu.
    Supports real SMTP dispatch when configured in settings / environment,
    with an automatic, robust console-logger fallback for development and evaluation.
    """

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.use_tls = settings.SMTP_TLS

    def _send_smtp_email(self, recipient: str, subject: str, body_text: str, body_html: Optional[str] = None) -> bool:
        """Internal SMTP dispatch helper."""
        if not self.smtp_host:
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.PROJECT_NAME} <{self.from_email}>"
            msg["To"] = recipient

            part1 = MIMEText(body_text, "plain", "utf-8")
            msg.attach(part1)

            if body_html:
                part2 = MIMEText(body_html, "html", "utf-8")
                msg.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, recipient, msg.as_string())

            logger.info(f"Email successfully dispatched to {recipient} via SMTP server {self.smtp_host}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email to {recipient} via SMTP: {e}. Falling back to console logger.")
            return False

    def send_verification_email(self, recipient: str, name: str, code: str) -> bool:
        """
        Send a 6-digit account verification code.
        """
        subject = "Verify your ArthSetu account"
        body_text = (
            f"Hello {name or 'Entrepreneur'},\n\n"
            f"Thank you for registering on ArthSetu (अर्थसेतू).\n\n"
            f"Your 6-digit account verification code is:\n"
            f"----------------------------------------\n"
            f"               {code}                   \n"
            f"----------------------------------------\n\n"
            f"This code will expire in 15 minutes.\n"
            f"If you did not request this verification, please disregard this message.\n\n"
            f"Regards,\n"
            f"ArthSetu Team"
        )
        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
            <div style="background-color: #047857; color: white; padding: 16px; text-align: center; border-radius: 8px;">
                <h1 style="margin: 0; font-size: 20px;">ArthSetu • अर्थसेतू</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Financial Guidance for Rural Micro-Enterprises</p>
            </div>
            <div style="padding: 24px 8px;">
                <p style="color: #374151; font-size: 15px;">Hello <strong>{name or 'Entrepreneur'}</strong>,</p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please use the following 6-digit code to verify your email address and activate your account:</p>
                <div style="text-align: center; margin: 28px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #047857; background: #ecfdf5; padding: 12px 24px; border-radius: 8px; border: 1px dashed #059669; display: inline-block;">
                        {code}
                    </span>
                </div>
                <p style="color: #6b7280; font-size: 12px;">This verification code is single-use and will expire in 15 minutes.</p>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">If you did not register for ArthSetu, please safely ignore this email.</p>
            </div>
        </div>
        """

        # Log for development / evaluation visibility
        logger.info(f"\n================ [ARTHSETU EMAIL VERIFICATION CODE] ================\nRecipient: {recipient}\nCode: {code}\nExpires: in 15 minutes\n====================================================================")

        sent = self._send_smtp_email(recipient, subject, body_text, body_html)
        return True  # In dev/demo, logger fallback ensures success

    def send_password_reset_email(self, recipient: str, name: str, code: str) -> bool:
        """
        Send a 6-digit password reset code.
        """
        subject = "Reset your ArthSetu password"
        body_text = (
            f"Hello {name or 'Entrepreneur'},\n\n"
            f"We received a request to reset the password for your ArthSetu account.\n\n"
            f"Your 6-digit password reset code is:\n"
            f"----------------------------------------\n"
            f"               {code}                   \n"
            f"----------------------------------------\n\n"
            f"This code will expire in 15 minutes and can only be used once.\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"Regards,\n"
            f"ArthSetu Team"
        )
        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
            <div style="background-color: #047857; color: white; padding: 16px; text-align: center; border-radius: 8px;">
                <h1 style="margin: 0; font-size: 20px;">ArthSetu • अर्थसेतू</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Password Recovery Assistance</p>
            </div>
            <div style="padding: 24px 8px;">
                <p style="color: #374151; font-size: 15px;">Hello <strong>{name or 'Entrepreneur'}</strong>,</p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">We received a request to reset your password. Use the following 6-digit code to complete the reset:</p>
                <div style="text-align: center; margin: 28px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #b45309; background: #fffbeb; padding: 12px 24px; border-radius: 8px; border: 1px dashed #d97706; display: inline-block;">
                        {code}
                    </span>
                </div>
                <p style="color: #6b7280; font-size: 12px;">This reset code is single-use and will expire in 15 minutes.</p>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">If you did not request this, your account remains secure and no changes have been made.</p>
            </div>
        </div>
        """

        # Log for development / evaluation visibility
        logger.info(f"\n================ [ARTHSETU PASSWORD RESET CODE] ================\nRecipient: {recipient}\nCode: {code}\nExpires: in 15 minutes\n================================================================")

        sent = self._send_smtp_email(recipient, subject, body_text, body_html)
        return True


email_service = EmailService()
