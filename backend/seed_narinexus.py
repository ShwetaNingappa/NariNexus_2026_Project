import os
import json
import uuid
from datetime import datetime
from backend.app.core.database import db_instance
from backend.app.core.config import settings
from backend.app.core.security import hash_password
from backend.app.services.user_service import MOCK_DB_FILE as MOCK_USERS_FILE, load_mock_users, save_mock_users
from backend.app.services.course_service import MOCK_COURSES_FILE, MOCK_LESSONS_FILE, load_mock_data, save_mock_data

# Seeder definitions for NariNexus
INITIAL_CENTRES = [
    {
        "id": "centre-bengaluru",
        "name": "Bengaluru Skill Development Centre",
        "description": "NariNexus flagship hub empowering urban and rural women in Jayanagar and surrounding sub-districts.",
        "address": "Plot 14, 3rd Block, Jayanagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "phone": "9999911111",
        "email": "blr.hub@narinexus.org",
        "instructor_name": "Kavitha Shridhar",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "operating_hours": "9:00 AM - 5:00 PM",
        "is_active": True
    },
    {
        "id": "centre-mysuru",
        "name": "Mysuru Women Skill Centre",
        "description": "Providing high-quality tailoring, traditional embroidery, and cottage business training.",
        "address": "No 45, Devaraj Urs Road",
        "city": "Mysuru",
        "state": "Karnataka",
        "phone": "9999922222",
        "email": "mys.centre@narinexus.org",
        "instructor_name": "Shobha Devi",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "operating_hours": "10:00 AM - 6:00 PM",
        "is_active": True
    },
    {
        "id": "centre-tumakuru",
        "name": "Tumakuru Rural Training Centre",
        "description": "Fostering organic agriculture, basic bookkeeping, and digital payments in Tumkur district.",
        "address": "Siddaganga Layout, B.H. Road",
        "city": "Tumakuru",
        "state": "Karnataka",
        "phone": "9999933333",
        "email": "tum.rural@narinexus.org",
        "instructor_name": "Radhamma Hegde",
        "latitude": 13.3379,
        "longitude": 77.1173,
        "operating_hours": "9:00 AM - 4:00 PM",
        "is_active": True
    },
    {
        "id": "centre-hubballi",
        "name": "Hubballi Digital & Craft Centre",
        "description": "Enabling digital entrepreneurship, online storefront setup, and smartphone payment capabilities.",
        "address": "Koppikar Road, Hubli",
        "city": "Hubballi",
        "state": "Karnataka",
        "phone": "9999944444",
        "email": "hub.digital@narinexus.org",
        "instructor_name": "Rupa Kulkarni",
        "latitude": 15.3647,
        "longitude": 75.1240,
        "operating_hours": "10:00 AM - 5:00 PM",
        "is_active": True
    }
]

INITIAL_COURSES = [
    {
        "id": "computer-basics-entrepreneurs",
        "title": "Computer Basics for Women Entrepreneurs",
        "description": "Master typing, folder organization, basic document editing, and online navigation to support your business operations.",
        "skill_id": "computer-literacy",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "online",
        "instructor": "Kavitha Shridhar",
        "prerequisites": ["None"],
        "career_outcomes": ["Office Assistant", "Data Entry Coordinator", "Smart Business Owner"],
        "language": "en",
        "is_active": True,
        "is_published": True,
        "status": "active",
        "centre_id": "centre-bengaluru",
        "centre_name": "Bengaluru Skill Development Centre",
        "centre_address": "Plot 14, 3rd Block, Jayanagar",
        "centre_city": "Bengaluru",
        "centre_state": "Karnataka",
        "centre_latitude": 12.9716,
        "centre_longitude": 77.5946,
        "contact_phone": "9999911111",
        "online_resources": [
            {
                "title": "Introduction to Computer Hardware (Video)",
                "type": "video",
                "url": "https://www.youtube.com/embed/gYOROf9X76g",
                "duration": "10 Mins",
                "provider": "NariNexus Online"
            }
        ],
        "translations": {
            "kn": {
                "title": "ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ",
                "description": "ನಿಮ್ಮ ವ್ಯವಹಾರದ ಕಾರ್ಯಾಚರಣೆಗಳನ್ನು ಬೆಂಬಲಿಸಲು ಟೈಪಿಂಗ್, ಫೋಲ್ಡರ್ ನಿರ್ವಹಣೆ, ಮೂಲ ದಾಖಲೆ ಸಂಪಾದನೆ ಮತ್ತು ಆನ್‌ಲೈನ್ ನ್ಯಾವಿಗೇಷನ್ ಕರಗತ ಮಾಡಿಕೊಳ್ಳಿ."
            }
        }
    },
    {
        "id": "secure-mobile-payments",
        "title": "Secure Mobile Payments & Digital Wallets",
        "description": "Learn how to use mobile payment platforms safely, set up UPI accounts, verify transfers, and protect your identity from cyber frauds.",
        "skill_id": "digital-payments",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "2 Weeks",
        "learning_mode": "online",
        "instructor": "Meera Naidu",
        "prerequisites": ["None"],
        "career_outcomes": ["Digital Commerce Assistant", "Smart Shop Operator", "Community Digital Guide"],
        "language": "en",
        "is_active": True,
        "is_published": True,
        "status": "active",
        "centre_id": "centre-bengaluru",
        "centre_name": "Bengaluru Skill Development Centre",
        "centre_address": "Plot 14, 3rd Block, Jayanagar",
        "centre_city": "Bengaluru",
        "centre_state": "Karnataka",
        "centre_latitude": 12.9716,
        "centre_longitude": 77.5946,
        "contact_phone": "9999911111",
        "online_resources": [
            {
                "title": "UPI and Mobile Safety Guide (Video)",
                "type": "video",
                "url": "https://www.youtube.com/embed/t4U9D8f-h9A",
                "duration": "12 Mins",
                "provider": "Digital India Initiative"
            }
        ],
        "translations": {
            "kn": {
                "title": "ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ ಪಾವತಿಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ವ್ಯಾಲೆಟ್‌ಗಳು",
                "description": "ಮೊಬೈಲ್ ಪಾವತಿ ವೇದಿಕೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸುವುದು, ಯುಪಿಐ ಖಾತೆಗಳನ್ನು ಹೊಂದಿಸುವುದು, ವರ್ಗಾವಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದು ಹೇಗೆ ಎಂದು ತಿಳಿಯಿರಿ."
            }
        }
    },
    {
        "id": "garment-alterations-basics",
        "title": "Garment Alterations & Needlework Basics",
        "description": "Learn sewing machine operation, straight stitches, button attachment, and professional hemline alterations for women's wear.",
        "skill_id": "basic-stitching",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "offline",
        "instructor": "Shobha Devi",
        "prerequisites": ["None"],
        "career_outcomes": ["Alterations Tailor", "Independent Sewist", "Garment Factory Operator"],
        "language": "en",
        "is_active": True,
        "is_published": True,
        "status": "active",
        "centre_id": "centre-mysuru",
        "centre_name": "Mysuru Women Skill Centre",
        "centre_address": "No 45, Devaraj Urs Road",
        "centre_city": "Mysuru",
        "centre_state": "Karnataka",
        "centre_latitude": 12.2958,
        "centre_longitude": 76.6394,
        "contact_phone": "9999922222",
        "translations": {
            "kn": {
                "title": "ಬಟ್ಟೆ ಮಾರ್ಪಾಡುಗಳು ಮತ್ತು ಮೂಲ ಹೊಲಿಗೆ ಕಲೆ",
                "description": "ಮಹಿಳಾ ಉಡುಪುಗಳಿಗಾಗಿ ಹೊಲಿಗೆ ಯಂತ್ರ ಕಾರ್ಯಾಚರಣೆ, ನೇರ ಹೊಲಿಗೆಗಳು, ಗುಂಡಿ ಅಳವಡಿಕೆ ಮತ್ತು ವೃತ್ತಿಪರ ಮಾರ್ಪಾಡುಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    {
        "id": "professional-blouse-cutting",
        "title": "Professional Blouse Pattern Cutting & Stitching",
        "description": "Master professional patterns, neck design styling, measurement cutting, and complete lining stitching for standard blouses and salwar suits.",
        "skill_id": "blouse-salwar-stitching",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "8 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Rehana Banu",
        "prerequisites": ["Basic Stitching & Alterations"],
        "career_outcomes": ["Custom Blouse Designer", "Boutique Proprietor", "Lining Dress Specialist"],
        "language": "en",
        "is_active": True,
        "is_published": True,
        "status": "active",
        "centre_id": "centre-bengaluru",
        "centre_name": "Bengaluru Skill Development Centre",
        "centre_address": "Plot 14, 3rd Block, Jayanagar",
        "centre_city": "Bengaluru",
        "centre_state": "Karnataka",
        "centre_latitude": 12.9716,
        "centre_longitude": 77.5946,
        "contact_phone": "9999911111",
        "online_resources": [
            {
                "title": "Blouse Back Neck Designs (Video)",
                "type": "video",
                "url": "https://www.youtube.com/embed/z52Xz9D_fEw",
                "duration": "15 Mins",
                "provider": "NariNexus Creative Tailoring"
            }
        ],
        "translations": {
            "kn": {
                "title": "ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಪ್ಯಾಟರ್ನ್ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಹೊಲಿಯುವುದು",
                "description": "ವೃತ್ತಿಪರ ಮಾದರಿಗಳು, ಕತ್ತಿನ ವಿನ್ಯಾಸ ಶೈಲಿ, ಅಳತೆ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಲೈನಿಂಗ್ ಹೊಲಿಗೆಯನ್ನು ಕರಗತ ಮಾಡಿಕೊಳ್ಳಿ."
            }
        }
    },
    {
        "id": "small-business-bookkeeping",
        "title": "Simple Bookkeeping & Financial Health for Small Business",
        "description": "Learn to track cash-flow, manage invoice registers, calculate profit & loss, and separate business funds from home expenses.",
        "skill_id": "micro-bookkeeping",
        "category_id": "entrepreneurship",
        "thumbnail": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "online",
        "instructor": "Sudha Murthy",
        "prerequisites": ["None"],
        "career_outcomes": ["Accounts Assistant", "Retail Manager", "Independent Business Owner"],
        "language": "en",
        "is_active": True,
        "is_published": True,
        "status": "active",
        "centre_id": "centre-tumakuru",
        "centre_name": "Tumakuru Rural Training Centre",
        "centre_address": "Siddaganga Layout, B.H. Road",
        "centre_city": "Tumakuru",
        "centre_state": "Karnataka",
        "centre_latitude": 13.3379,
        "centre_longitude": 77.1173,
        "contact_phone": "9999933333",
        "online_resources": [
            {
                "title": "Financial Ledger Setup (Video)",
                "type": "video",
                "url": "https://www.youtube.com/embed/9o9L6O4_R4A",
                "duration": "8 Mins",
                "provider": "Microfinance Council"
            }
        ],
        "translations": {
            "kn": {
                "title": "ಸಣ್ಣ ಉದ್ಯಮಕ್ಕಾಗಿ ಸರಳ ಬುಕ್ಕೀಪಿಂಗ್ ಮತ್ತು ಹಣಕಾಸು ನಿರ್ವಹಣೆ",
                "description": "ನಗದು ಹರಿವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು, ಇನ್‌ವಾಯ್ಸ್ ನಿರ್ವಹಿಸುವುದು, ಲಾಭ ಮತ್ತು ನಷ್ಟ ಲೆಕ್ಕ ಹಾಕುವುದು ಮತ್ತು ಉದ್ಯಮ ಹಣವನ್ನು ಮನೆ ವೆಚ್ಚದಿಂದ ಬೇರ್ಪಡಿಸುವುದು ಕಲಿಯಿರಿ."
            }
        }
    }
]

INITIAL_LESSONS = [
    {
        "id": "les-os-intro",
        "course_id": "computer-basics-entrepreneurs",
        "title": "Introduction to Operating Systems",
        "description": "Understand what an operating system is, how computer interfaces work, and how to safely boot, sleep, and shut down systems.",
        "lesson_number": 1,
        "content_type": "article",
        "content": "### Welcome to Computer Basics\n\nIn this lesson, we will cover the fundamentals of a Computer Operating System (OS). \n\nAn Operating System is the software that manages your computer's hardware and makes it possible for you to click on applications, open internet browsers, and print invoices. The most common operating systems are **Windows** and **macOS** for laptops, and **Android** for mobile phones.\n\n#### Key Actions:\n1. **Booting up**: Press the physical Power button on your laptop. Wait for the loading screen.\n2. **The Desktop Screen**: This is your digital table. It contains icons (shortcuts to apps) and your Taskbar (the strip at the bottom showcasing opened apps).\n3. **Safe Shut Down**: Do NOT press and hold the power button to shut down. Go to the Start Menu, click Power, and select 'Shut Down' to protect your system files.",
        "duration": "15 Mins",
        "is_preview": True
    },
    {
        "id": "les-kb-shortcuts",
        "course_id": "computer-basics-entrepreneurs",
        "title": "Keyboard Navigation & Shortcuts",
        "description": "Learn basic typing principles and key shortcuts that will save you hours of work when managing business records.",
        "lesson_number": 2,
        "content_type": "article",
        "content": "### Keyboard Secrets\n\nTo manage an online enterprise, you need to navigate typing fields quickly. Here are the most essential keys:\n\n* **Shift**: Hold this and press any letter to make it UPPERCASE.\n* **Caps Lock**: Press once to type everything in UPPERCASE. Press again to turn it off.\n* **Backspace**: Deletes the character directly to the left of your cursor.\n* **Delete**: Deletes the character to the right of your cursor.\n\n#### Key Shortcuts:\n- **Copy**: `Ctrl + C` (copies highlighted text/files)\n- **Paste**: `Ctrl + V` (places copied content in selection)\n- **Undo**: `Ctrl + Z` (undoes your last mistake!)",
        "duration": "20 Mins",
        "is_preview": True
    },
    {
        "id": "les-folder-mgt",
        "course_id": "computer-basics-entrepreneurs",
        "title": "Creating & Managing Folders",
        "description": "Keep your client receipts, product catalog files, and license documents organized by mastering folder management.",
        "lesson_number": 3,
        "content_type": "article",
        "content": "### Stay Organized, Stay Smart\n\nWhen running a small boutique or tailoring store, disorganized files can lose you clients. Today we learn to create safe directories.\n\n1. **Right Click** on any empty desktop area.\n2. Select **New** -> **Folder**.\n3. Type a clear name like `Client_Receipts_2026`.\n4. Click **Enter** to save the folder.\n\nYou can drag-and-drop receipt images directly into this folder to back them up safely.",
        "duration": "15 Mins",
        "is_preview": False
    },
    {
        "id": "les-upi-setup",
        "course_id": "secure-mobile-payments",
        "title": "Setting up your UPI Account",
        "description": "Step-by-step tutorial on linking your bank account to a Unified Payments Interface (UPI) app safely.",
        "lesson_number": 1,
        "content_type": "article",
        "content": "### What is UPI?\n\nUnified Payments Interface (UPI) is a real-time instant payment system developed by National Payments Corporation of India (NPCI). It allows you to transfer money instantly between bank accounts on your mobile phone.\n\n#### Checklist for UPI Setup:\n- A smartphone with internet\n- Your bank account linked to your mobile phone number\n- Your debit card handy\n\n#### Step-by-Step Setup:\n1. Download a certified app: BHIM, Google Pay, or PhonePe from the Google Play Store.\n2. Verify your mobile number using an automatic SMS verification.\n3. Select your Bank Name from the listing. The app will automatically find your account.\n4. Enter the last 6 digits of your debit card and expiration date to generate your unique **UPI PIN**.\n\n*CRITICAL SECURITY RULE:* Never share your UPI PIN with anyone, not even bank executives!",
        "duration": "15 Mins",
        "is_preview": True
    },
    {
        "id": "les-sewing-machine",
        "course_id": "garment-alterations-basics",
        "title": "Introduction to Sewing Machine Operations",
        "description": "Learn the parts of a mechanical sewing machine, thread path loops, bobbin winding, and adjusting stitch length dials.",
        "lesson_number": 1,
        "content_type": "article",
        "content": "### Getting to Know your Machine\n\nBefore you stitch fabrics, you must understand your tool. A standard sewing machine has several core components:\n\n1. **Flywheel (Handwheel)**: Located on the right. Always turn it TOWARDS you to raise or lower the needle manually.\n2. **Presser Foot**: The small metal clamp that holds the fabric flat against the needle plate. Lower it before stitching!\n3. **Bobbin Winder**: Winds the bottom thread. The bobbin sits underneath the needle and locks the stitch.\n\n#### Threading Steps:\n- Place thread spool on spindle.\n- Guide thread through tension disks.\n- Loop through the take-up lever.\n- Needle threading goes from left to right (or front to back depending on model).",
        "duration": "25 Mins",
        "is_preview": True
    },
    {
        "id": "les-straight-stitch",
        "course_id": "garment-alterations-basics",
        "title": "Mastering the Straight Stitch",
        "description": "Practical exercises on guided straight stitching, speed controls, and sewing borders on test cotton fabrics.",
        "lesson_number": 2,
        "content_type": "article",
        "content": "### Practice Straight Lines\n\nDo not worry if your first stitches are wavy! Everyone starts there. Follow these practice rules:\n\n* **Do not pull fabric**: Let the machine feed-dogs pull the fabric naturally. Just guide it gently with your fingers.\n* **Reverse Stitching**: Find the reverse lever (usually on the front right). Hold it down for 3 stitches at the start and end of your line to tie knots and lock your threads.",
        "duration": "30 Mins",
        "is_preview": True
    },
    {
        "id": "les-inc-exp",
        "course_id": "small-business-bookkeeping",
        "title": "Understanding Income & Expenses",
        "description": "Identify basic transaction entries and learn how to segregate business accounts from personal household bills.",
        "lesson_number": 1,
        "content_type": "article",
        "content": "### Financial Discipline\n\nMany small ventures fail because owners mix family cash with business revenues. Today you learn to separate them.\n\n* **Business Income**: Money earned from selling stitched garments, baked breads, or craft work.\n* **Business Expenses**: Money spent on fabrics, needles, flour, mobile phone internet bills, or stall rent.\n* **Personal Expenses**: Family milk, school fees, personal clothes. Do NOT record these in your business ledger!\n\n#### Rule of Thumb:\nHave a dedicated cash pouch for your business. When you make a sale, put the money there. When buying raw material, pay from that pouch. Never borrow from it for grocery bills.",
        "duration": "15 Mins",
        "is_preview": True
    }
]

def seed_narinexus_data():
    print("=========================================")
    print("  NARINEXUS ADVANCED SYSTEM SEEDER STARTED  ")
    print("=========================================")

    # 1. Mock Local JSON Fallback Seeding
    print("\n[Step 1/2] Seeding Local JSON Fallback Databases...")
    
    # Seed Mock Centres
    mock_centres_file = os.path.join(os.path.dirname(__file__), "backend", "app", "services", "mock_centres.json")
    os.makedirs(os.path.dirname(mock_centres_file), exist_ok=True)
    save_mock_data(mock_centres_file, INITIAL_CENTRES)
    print(f"✓ Local centres seeded at: {mock_centres_file}")

    # Seed Mock Courses
    save_mock_data(MOCK_COURSES_FILE, INITIAL_COURSES)
    print(f"✓ Local courses seeded at: {MOCK_COURSES_FILE}")

    # Seed Mock Lessons
    save_mock_data(MOCK_LESSONS_FILE, INITIAL_LESSONS)
    print(f"✓ Local lessons seeded at: {MOCK_LESSONS_FILE}")

    # 2. MongoDB Atlas Database Seeding
    print("\n[Step 2/2] Seeding Primary MongoDB Atlas Database...")
    db = db_instance.get_db()
    if db is not None:
        try:
            # Seed Centres (upsert to prevent duplicate duplicates)
            for centre in INITIAL_CENTRES:
                db["centres"].replace_one({"id": centre["id"]}, centre, upsert=True)
            print("✓ MongoDB 'centres' upserted successfully.")

            # Seed Courses
            for course in INITIAL_COURSES:
                db["courses"].replace_one({"id": course["id"]}, course, upsert=True)
            print("✓ MongoDB 'courses' upserted successfully.")

            # Seed Lessons
            for lesson in INITIAL_LESSONS:
                db["lessons"].replace_one({"id": lesson["id"]}, lesson, upsert=True)
            print("✓ MongoDB 'lessons' upserted successfully.")

            # Seed extra demo learner profile points / streaks if empty
            db["users"].update_many(
                {"role": "learner", "points": {"$exists": False}},
                {"$set": {"points": 50, "streak": 1, "last_activity_date": datetime.utcnow().date().isoformat()}}
            )
            print("✓ Synced points and streak parameters on MongoDB 'users'.")
            print("\n🎉 MONGODB ATLAS SEEDING COMPLETED SUCCESSFULLY!")
        except Exception as e_db:
            print(f"⚠ MongoDB write issue: {str(e_db)}. Resilient fallback maintained completely.")
    else:
        print("⚠ MongoDB Uri is empty or server unreachable. Falling back completely to offline JSON seeder state.")

    print("\n=========================================")
    print("   NARINEXUS SEED PROCESS COMPLETE!      ")
    print("=========================================")

if __name__ == "__main__":
    # Perform standard connection checks
    from backend.app.core.database import Database
    Database.connect()
    seed_narinexus_data()
