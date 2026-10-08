import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
import json
import re
from datetime import datetime
from typing import List, Optional, Dict, Any
from backend.app.core.config import settings

logger = logging.getLogger("narinexus.communication")

DEV_COMMUNICATION_LOG_FILE = os.path.join(os.path.dirname(__file__), "dev_communication_log.json")

def _save_dev_communication(to_email: str, subject: str, html_content: str, channel: str = "email"):
    """
    Saves communication details locally for offline development, local debugging,
    and automated testing verification without actually needing configured SMTP credentials.
    """
    try:
        data = []
        if os.path.exists(DEV_COMMUNICATION_LOG_FILE):
            with open(DEV_COMMUNICATION_LOG_FILE, "r") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    data = []
        
        data.append({
            "timestamp": datetime.utcnow().isoformat(),
            "channel": channel,
            "to": to_email.strip().lower(),
            "subject": subject,
            "body_snippet": html_content[:200] + ("..." if len(html_content) > 200 else "")
        })
        
        # Keep log file size reasonable (max 100 entries)
        if len(data) > 100:
            data = data[-100:]
            
        with open(DEV_COMMUNICATION_LOG_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save local development communication log: {str(e)}")

class CommunicationService:
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Deterministic recipient validation to prevent sending to invalid patterns or blank values.
        """
        if not email or not isinstance(email, str):
            return False
        email_clean = email.strip()
        # Basic email format pattern validation
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return bool(re.match(pattern, email_clean))

    @classmethod
    def send_transactional_email(cls, to_email: str, subject: str, html_content: str) -> bool:
        """
        Sends transactional or event-triggered email using SMTP credentials with a safe offline log fallback.
        Failure-safe by design: under no circumstances will SMTP failures crash the primary application transaction.
        Includes single-recipient/abuse restriction.
        """
        # 1. Recipient validation
        if not cls.validate_email(to_email):
            logger.warning(f"[COMMUNICATION REJECTED] Invalid recipient email format: {to_email}")
            return False

        email_clean = to_email.strip().lower()
        
        # 2. Prevent accidental bulk abuse (Only transactional, single-recipient mailings are permitted)
        # Check if the string has a comma indicating multiple recipients or bulk list
        if "," in email_clean or ";" in email_clean:
            logger.warning("[COMMUNICATION SAFETY] Accidental bulk emailing detected and blocked.")
            return False

        # 3. Check configuration state
        smtp_configured = all([
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
            settings.SMTP_FROM_EMAIL
        ])

        # Write to dev log fallback unconditionally for test suite assertions
        _save_dev_communication(email_clean, subject, html_content, channel="email")

        if not smtp_configured:
            logger.info(f"[COMM_SERVICE DEV FALLBACK] Logged transactional email to {email_clean} due to unconfigured SMTP.")
            return True

        # 4. Fire-and-forget SMTP dispatch with total timeout and safety boundaries
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = email_clean
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            # Use 5 seconds timeout to avoid hanging main application thread
            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
                server.starttls()
            
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [email_clean], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent transactional email to {email_clean}")
            
            # Record audit event
            try:
                from backend.app.services.audit_service import AuditService
                AuditService.record_audit_event(
                    actor_user_id="system",
                    actor_role="system",
                    action="COMMUNICATION_SUCCESS",
                    resource_type="EMAIL",
                    resource_id=email_clean,
                    success=True,
                    metadata={"subject": subject}
                )
            except Exception:
                pass
                
            return True
        except Exception as e:
            # Absolute safety capture: log SMTP errors cleanly, do NOT throw upwards to break business transactions
            logger.error(f"Safe handled SMTP dispatch error for {email_clean}: {str(e)}")
            
            # Record audit event
            try:
                from backend.app.services.audit_service import AuditService
                AuditService.record_audit_event(
                    actor_user_id="system",
                    actor_role="system",
                    action="COMMUNICATION_FAILURE",
                    resource_type="EMAIL",
                    resource_id=email_clean,
                    success=False,
                    metadata={"subject": subject, "error": str(e)}
                )
            except Exception:
                pass
                
            # Return False to signify actual SMTP failure, keeping caller thread secure and un-crashed
            return False
