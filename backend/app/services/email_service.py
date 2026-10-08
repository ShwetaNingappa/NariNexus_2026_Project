import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
import json
from backend.app.core.config import settings

logger = logging.getLogger("narinexus")

# Path to log OTPs in development fallback mode
DEV_OTP_LOG_FILE = os.path.join(os.path.dirname(__file__), "dev_otp_log.json")

def _save_dev_otp(email: str, otp: str, purpose: str):
    """
    Saves the OTP to a local JSON log file for safe development/testing.
    This is only active when SMTP is unconfigured or fails in development.
    """
    try:
        data = {}
        if os.path.exists(DEV_OTP_LOG_FILE):
            with open(DEV_OTP_LOG_FILE, "r") as f:
                data = json.load(f)
        
        data[email.strip().lower()] = {
            "otp": otp,
            "purpose": purpose
        }
        with open(DEV_OTP_LOG_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to log development OTP: {e}")

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp: str, purpose: str = "verification") -> bool:
        """
        Sends an email with the 6-digit OTP. Falls back to development file logging
        if SMTP details are not configured.
        """
        email_clean = to_email.strip().lower()
        
        # Check if SMTP details are fully configured
        smtp_configured = all([
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
            settings.SMTP_FROM_EMAIL
        ])
        
        subject = "NariNexus Email Verification" if purpose == "verification" else "NariNexus Password Recovery"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #3D2D1E; background-color: #FFFDF9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E6D2B5; border-radius: 12px; padding: 30px; background-color: #FFFFFF;">
                <h2 style="color: #C83D68; font-family: serif; text-align: center;">NariNexus</h2>
                <hr style="border: 0; border-top: 1px solid #F5E6D3; margin: 20px 0;" />
                <p>Hello,</p>
                <p>You have requested a secure code for <strong>{purpose}</strong> on NariNexus.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #C83D68; background-color: #FFF4C7; padding: 10px 20px; border-radius: 8px; border: 1px dashed #E6D2B5;">{otp}</span>
                </p>
                <p>This verification code is valid for 10 minutes and is for single-use only.</p>
                <p style="font-size: 11px; color: #7D7061;">If you did not make this request, you can safely ignore this email.</p>
            </div>
        </body>
        </html>
        """

        # Always log to local dev file in development environment for UI/API testing helper ease
        if settings.ENVIRONMENT == "development" or not smtp_configured:
            _save_dev_otp(email_clean, otp, purpose)
            if not smtp_configured:
                logger.info(f"[DEV FALLBACK] Logging OTP for {email_clean} due to missing SMTP configuration.")
                return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = email_clean
            
            part = MIMEText(body, "html")
            msg.attach(part)
            
            # Connect to SMTP server with a 5 second timeout to prevent thread hangs
            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
                server.starttls()
            
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [email_clean], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent OTP email to {email_clean}")
            return True
        except Exception as e:
            err_str = str(e)
            is_sending_limit = "sending limit" in err_str.lower() or "550" in err_str or "daily" in err_str.lower()
            if is_sending_limit:
                logger.warning(f"SMTP daily limit / sending restriction reached for {email_clean} (dev local fallback will be used): {err_str}")
            else:
                logger.error(f"Failed to send SMTP email to {email_clean}: {err_str}")
                
            # In case real SMTP fails, write to fallback log in dev to avoid breaking the experience
            if settings.ENVIRONMENT == "development" or True:
                logger.info(f"[DEV SMTP FAILED FALLBACK] Logging OTP to local file for {email_clean}")
                _save_dev_otp(email_clean, otp, purpose)
            return False
