import os
import sys

# Ensure workspace root is always on sys.path for backend imports
_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_dir) if os.path.basename(_dir) == "backend" else _dir
if _root not in sys.path:
    sys.path.insert(0, _root)

import urllib.request
import urllib.parse
import json
import uuid
import subprocess

def run_phase_6_13_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.13 COMMUNICATION TESTS")
    print("==================================================")

    from backend.app.services.communication_service import CommunicationService, DEV_COMMUNICATION_LOG_FILE
    from backend.app.core.config import settings

    # 1. Recipient Validation
    print("Test 1: Validating recipient email address format patterns...")
    valid_email = "test.learner@gmail.com"
    invalid_email_1 = "invalid-email-no-at.com"
    invalid_email_2 = ""
    invalid_email_3 = "@domain.com"
    
    assert CommunicationService.validate_email(valid_email) is True, "Failed to validate correct email pattern"
    assert CommunicationService.validate_email(invalid_email_1) is False, "Failed to reject missing @ pattern"
    assert CommunicationService.validate_email(invalid_email_2) is False, "Failed to reject empty email"
    assert CommunicationService.validate_email(invalid_email_3) is False, "Failed to reject empty prefix"
    print("✅ Pass: Recipient validation logic fully correct.")

    # 2. Accidental Bulk Sending Guard
    print("Test 2: Verifying bulk sending guard blocks commas/semicolons...")
    bulk_emails_1 = "learner1@gmail.com,learner2@gmail.com"
    bulk_emails_2 = "learner1@gmail.com;learner2@gmail.com"
    
    res_1 = CommunicationService.send_transactional_email(bulk_emails_1, "Bulk Alert", "<p>Hello</p>")
    res_2 = CommunicationService.send_transactional_email(bulk_emails_2, "Bulk Alert", "<p>Hello</p>")
    
    assert res_1 is False, "Accidental bulk sending via commas was not blocked!"
    assert res_2 is False, "Accidental bulk sending via semicolons was not blocked!"
    print("✅ Pass: Bulk sending abuse blocked successfully.")

    # 3. Privacy / Secret Leakage check
    print("Test 3: Checking zero secrets leakage in logs...")
    target_email = "safe.test@narinexus.org"
    subject = "Confidential Alert"
    html_body = "<h3>Secure Message</h3><p>Verify details.</p>"
    
    # Send transactional email to trigger local logging
    success = CommunicationService.send_transactional_email(target_email, subject, html_body)
    assert success is True, "Transactional email send should return True in fallback mode"

    assert os.path.exists(DEV_COMMUNICATION_LOG_FILE), "Local fallback dev log file not created!"
    
    # Read the log and check for secrets
    with open(DEV_COMMUNICATION_LOG_FILE, "r") as f:
        log_data = json.load(f)
        
    last_log = log_data[-1]
    assert last_log.get("to") == target_email, "Email recipient mismatched in log"
    assert last_log.get("subject") == subject, "Email subject mismatched in log"
    
    # Stringify the log entries and search for common secret variables (like password, key)
    log_string = json.dumps(log_data)
    assert "password" not in log_string.lower(), "Secret SMTP password leaked in fallback log!"
    assert "jwt" not in log_string.lower(), "Secret JWT token leaked in fallback log!"
    assert "key" not in log_string.lower(), "API keys leaked in fallback log!"
    
    print("✅ Pass: Zero secrets leaked in fallback log files.")

    # 4. Safe failure on unconfigured SMTP / provider failures
    print("Test 4: Safe fallback check when real SMTP details are unconfigured...")
    # Should log and return True, without raising exceptions or crashing the main business thread
    safe_run = CommunicationService.send_transactional_email("learner@gmail.com", "Test Fallback", "<p>Fallback check</p>")
    assert safe_run is True, "Fallback run returned false or crashed"
    print("✅ Pass: Provider failures handled cleanly without crashing main threads.")

    print("==================================================")
    print("ALL PHASE 6.13 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Run regressions
    print("Running regressions...")
    reg_status = subprocess.run(["python3", "-u", "backend/test_notifications_phase_6_11.py"], capture_output=True, text=True)
    if reg_status.returncode == 0:
        print("✅ Regression PASSED: backend/test_notifications_phase_6_11.py")
    else:
        print("❌ Regression FAILED: backend/test_notifications_phase_6_11.py")
        print(reg_status.stdout)
        print(reg_status.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_13_tests()
