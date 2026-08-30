import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.core.database import db_instance

MOCK_COURSES_FILE = os.path.join(os.path.dirname(__file__), "mock_courses.json")
MOCK_LESSONS_FILE = os.path.join(os.path.dirname(__file__), "mock_lessons.json")

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
        "translations": {
            "kn": {
                "title": "ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ ಪಾವತಿಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ವ್ಯಾಲೆಟ್‌ಗಳು",
                "description": "ಮೊಬೈಲ್ ಪಾವತಿ ವೇದಿಕೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸುವುದು, ಯುಪಿಐ ಖಾತೆಗಳನ್ನು ಹೊಂದಿಸುವುದು, ವರ್ಗಾವಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದು ಹೇಗೆ ಎಂದು ತಿಳಿಯಿರಿ."
            }
        }
    },
    {
        "id": "social-media-marketing-brands",
        "title": "Social Media Marketing for Local Brands",
        "description": "Grow your local customer base by marketing your stitching, handicraft, or food products on WhatsApp Business, Google Maps, and Instagram.",
        "skill_id": "digital-marketing",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "6 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Dr. Aruna Sen",
        "prerequisites": ["Basic Computer Literacy"],
        "career_outcomes": ["Social Media Business Promoter", "Online Store Coordinator", "Marketing Assistant"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ಸ್ಥಳೀಯ ಬ್ರ್ಯಾಂಡ್‌ಗಳಿಗಾಗಿ ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ಮಾರ್ಕೆಟಿಂಗ್",
                "description": "ವಾಟ್ಸಾಪ್ ಬಿಸಿನೆಸ್, ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಮತ್ತು ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಹೊಲಿಗೆ, ಕರಕುಶಲ ವಸ್ತುಗಳು ಅಥವಾ ಆಹಾರ ಉತ್ಪನ್ನಗಳನ್ನು ಪ್ರಚಾರ ಮಾಡಿ ಸ್ಥಳೀಯ ಗ್ರಾಹಕರನ್ನು ಹೆಚ್ಚಿಸಿ."
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
        "translations": {
            "kn": {
                "title": "ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಪ್ಯಾಟರ್ನ್ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಹೊಲಿಯುವುದು",
                "description": "ವೃತ್ತಿಪರ ಮಾದರಿಗಳು, ಕತ್ತಿನ ವಿನ್ಯಾಸ ಶೈಲಿ, ಅಳತೆ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಲೈನಿಂಗ್ ಹೊಲಿಗೆಯನ್ನು ಕರಗತ ಮಾಡಿಕೊಳ್ಳಿ."
            }
        }
    },
    {
        "id": "zardosi-bridal-embroidery",
        "title": "Zardosi Hand Embroidery & Bridal Necklines",
        "description": "Advanced wedding dressmaking, Zardosi gold thread stitching, bridal hand embroidery patterns, beads hooking, and custom boutique creations.",
        "skill_id": "bridal-embroidery",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
        "difficulty": "advanced",
        "duration": "12 Weeks",
        "learning_mode": "offline",
        "instructor": "Fatima Begum",
        "prerequisites": ["Blouse & Salwar Stitching"],
        "career_outcomes": ["Bridal Wear Specialist", "Boutique Entrepreneur", "Master Embroidery Designer"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ಜರ್ದೋಸಿ ಹ್ಯಾಂಡ್ ಎಂಬ್ರಾಯ್ಡರಿ ಮತ್ತು ವಧುವಿನ ನೆಕ್‌ಲೈನ್ಸ್",
                "description": "ಸುಧಾರಿತ ಮದುವೆಯ ಉಡುಗೆ ತಯಾರಿಕೆ, ಜರ್ದೋಸಿ ಚಿನ್ನದ ದಾರದ ಹೊಲಿಗೆಗಳು, ವಧುವಿನ ಹ್ಯಾಂಡ್ ಎಂಬ್ರಾಯ್ಡರಿ ಮತ್ತು ಕಸ್ಟಮ್ ಬೊಟಿಕ್ ವಿನ್ಯಾಸಗಳು."
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
        "translations": {
            "kn": {
                "title": "ಸಣ್ಣ ಉದ್ಯಮಕ್ಕಾಗಿ ಸರಳ ಬುಕ್ಕೀಪಿಂಗ್ ಮತ್ತು ಹಣಕಾಸು ನಿರ್ವಹಣೆ",
                "description": "ನಗದು ಹರಿವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು, ಇನ್‌ವಾಯ್ಸ್ ನಿರ್ವಹಿಸುವುದು, ಲಾಭ ಮತ್ತು ನಷ್ಟ ಲೆಕ್ಕ ಹಾಕುವುದು ಮತ್ತು ಉದ್ಯಮ ಹಣವನ್ನು ಮನೆ ವೆಚ್ಚದಿಂದ ಬೇರ್ಪಡಿಸುವುದು ಕಲಿಯಿರಿ."
            }
        }
    },
    {
        "id": "ecomm-setup-ondc",
        "title": "Opening an E-commerce Store on ONDC",
        "description": "List your handcrafted, stitched, or baked products online through the Open Network for Digital Commerce (ONDC) to find buyers across India.",
        "skill_id": "online-shop-setup",
        "category_id": "entrepreneurship",
        "thumbnail": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "6 Weeks",
        "learning_mode": "online",
        "instructor": "Rupa Kulkarni",
        "prerequisites": ["Basic Computer Literacy", "Micro-Enterprise Bookkeeping"],
        "career_outcomes": ["E-commerce Retailer", "Digital Operations Planner", "Store Catalog Specialist"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ONDC ಯಲ್ಲಿ ಆನ್‌ಲೈನ್ ಇ-ಕಾಮರ್ಸ್ ಸ್ಟೋರ್ ಸ್ಥಾಪನೆ",
                "description": "ನಿಮ್ಮ ಕರಕುಶಲ ವಸ್ತುಗಳು, ಹೊಲಿಗೆ ಅಥವಾ ಬೇಕಿಂಗ್ ಉತ್ಪನ್ನಗಳನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ONDC ನೆಟ್‌ವರ್ಕ್ ಮೂಲಕ ಭಾರತದಾದ್ಯಂತ ಮಾರಾಟ ಮಾಡಿ."
            }
        }
    },
    {
        "id": "crochet-home-decor",
        "title": "Crochet Home Decor & Handmade Woolens",
        "description": "Master beautiful crochet needle chains, woolen home-decor patterns, and handcrafted table mats for commercial selling.",
        "skill_id": "embroidery-crochet",
        "category_id": "handicrafts",
        "thumbnail": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "offline",
        "instructor": "Lakshmi Narayana",
        "prerequisites": ["None"],
        "career_outcomes": ["Crochet Crafter", "Handicrafts Teacher", "Boutique Decor Designer"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ಕ್ರೋಚೆಟ್ ಗೃಹಾಲಂಕಾರ ಮತ್ತು ಕೈಯಿಂದ ಮಾಡಿದ ಉಣ್ಣೆಯ ಕರಕುಶಲ",
                "description": "ಸುಂದರವಾದ ಕ್ರೋಚೆಟ್ ಸೂಜಿ ಸರಪಳಿಗಳು, ಉಣ್ಣೆಯ ಅಲಂಕಾರಿಕ ಮಾದರಿಗಳು ಮತ್ತು ಟೇಬಲ್ ಮ್ಯಾಟ್‌ಗಳ ಕೈಯಿಂದ ತಯಾರಿಕೆ ಕಲಿಯಿರಿ."
            }
        }
    },
    {
        "id": "home-baking-confectionery",
        "title": "Home Baking: Teacakes, Cookies & Biscuits",
        "description": "Learn standard measurement scales, oven operations, eggless baking recipes, professional icing, and food safety standards.",
        "skill_id": "baking-confectionery",
        "category_id": "food-catering",
        "thumbnail": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "6 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Chef Nupur Roy",
        "prerequisites": ["None"],
        "career_outcomes": ["Professional Home Baker", "Catering Assistant", "Bakery Stall Owner"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ಮನೆ ಬೇಕಿಂಗ್: ಟೀಕೇಕ್, ಕುಕೀಸ್ ಮತ್ತು ಬಿಸ್ಕತ್ತುಗಳು",
                "description": "ಪ್ರಮಾಣಿತ ಅಳತೆಗಳು, ಓವನ್ ಕಾರ್ಯಾಚರಣೆ, ಮೊಟ್ಟೆಯಿಲ್ಲದ ಬೇಕಿಂಗ್ ಪಾಕವಿಧಾನಗಳು ಮತ್ತು ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    {
        "id": "kitchen-gardening-composting",
        "title": "Organic Kitchen Gardening & Vermicomposting",
        "description": "Create organic kitchen vegetable boxes, manage natural soil composting, make natural pesticides (Panchagavya), and increase crop yields.",
        "skill_id": "organic-farming",
        "category_id": "agriculture",
        "thumbnail": "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "6 Weeks",
        "learning_mode": "offline",
        "instructor": "Radhamma Hegde",
        "prerequisites": ["None"],
        "career_outcomes": ["Organic Produce Vendor", "Farm Soil Consultant", "Bio-Fertilizer Supplier"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ಸಾವಯವ ಅಡುಗೆಮನೆ ತೋಟಗಾರಿಕೆ ಮತ್ತು ಎರೆಗೊಬ್ಬರ",
                "description": "ಸಾವಯವ ಅಡುಗೆಮನೆ ತರಕಾರಿ ತೋಟಗಾರಿಕೆ, ನೈಸರ್ಗಿಕ ಮಣ್ಣು ಕಾಂಪೋಸ್ಟ್ ನಿರ್ವಹಣೆ ಮತ್ತು ಸಾವಯವ ಕೀಟನಾಶಕ ತಯಾರಿಕೆ."
            }
        }
    },
    {
        "id": "elderly-nursing-firstaid",
        "title": "Elderly Nursing Care & Emergency First Aid",
        "description": "Learn vital blood pressure and sugar readings, elderly nutrition, home patient safety, and critical life-saving first aid techniques.",
        "skill_id": "elder-care",
        "category_id": "healthcare-caregiving",
        "thumbnail": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "8 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Sister Mary Joseph",
        "prerequisites": ["None"],
        "career_outcomes": ["Geriatric Care Assistant", "Emergency First Responder", "Nursing Assistant"],
        "language": "en",
        "is_active": True,
        "translations": {
            "kn": {
                "title": "ವೃದ್ಧರ ಆರೈಕೆ ಮತ್ತು ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
                "description": "ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸಕ್ಕರೆ ಪರೀಕ್ಷೆ, ವೃದ್ಧರ ಆಹಾರ ಮತ್ತು ಸುರಕ್ಷತೆ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ತಂತ್ರಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    }
]

INITIAL_LESSONS = [
    # Lessons for computer-basics-entrepreneurs
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

    # Lessons for secure-mobile-payments
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
        "id": "les-pay-transfer",
        "course_id": "secure-mobile-payments",
        "title": "Making your First Digital Transfer",
        "description": "Learn how to scanning QR codes and use mobile numbers to accept and send instant merchant payments.",
        "lesson_number": 2,
        "content_type": "article",
        "content": "### Making Payments Simpler\n\nThere are three ways to pay or receive payments using your newly setup UPI ID:\n\n1. **Scanning QR Codes**: Point your camera at a store's paper QR stand. Type the amount and input your secure UPI PIN.\n2. **Using Mobile Number**: Type the customer's linked mobile number, select the bank, and proceed with verification.\n3. **Requesting Money**: Only do this if a customer explicitly requested an invoice. Verify their name on screen before approving requests.",
        "duration": "10 Mins",
        "is_preview": True
    },
    {
        "id": "les-anti-fraud",
        "course_id": "secure-mobile-payments",
        "title": "Avoiding Online Financial Frauds",
        "description": "Crucial security guidelines on spotting online payment scams, phishing links, and fake screenshot receipts.",
        "lesson_number": 3,
        "content_type": "article",
        "content": "### Protect Your Earnings\n\nAs a NariNexus learner, your financial safety is our highest priority. Scammers use tricks to pull money from your account. Memorize these golden rules:\n\n* **No UPI PIN is needed to RECEIVE money**: If someone tells you to enter your PIN to receive an advance, they are stealing your money.\n* **Double Check Fake Screenshots**: Customers might show you a green payment successful screenshot on their phone. Do NOT hand over products until you receive an SMS directly from your bank or see the transaction updated in your own UPI app history.",
        "duration": "20 Mins",
        "is_preview": False
    },

    # Lessons for garment-alterations-basics
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

    # Lessons for small-business-bookkeeping
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
    },
    {
        "id": "les-sales-register",
        "course_id": "small-business-bookkeeping",
        "title": "Creating your Daily Sales Register",
        "description": "Learn how to record transactions in a simple paperback notebook or mobile journal app systematically.",
        "lesson_number": 2,
        "content_type": "article",
        "content": "### The Notebook Ledger\n\nDraw five columns in a clean notebook:\n\n| Date | Description | Category | Cash In (+) | Cash Out (-) |\n|------|-------------|----------|-------------|--------------|\n| 2026-08-01 | Opening Balance | Setup | 500.00 | - |\n| 2026-08-01 | Bought Cotton Thread | Raw Material | - | 45.00 |\n| 2026-08-02 | Salwar Stitching Sale | Income | 350.00 | - |\n\nSum your totals at the end of each week to see exactly how much cash is remaining.",
        "duration": "20 Mins",
        "is_preview": True
    }
]

def load_mock_data(filepath: str) -> List[Dict[str, Any]]:
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_mock_data(filepath: str, data: List[Dict[str, Any]]):
    try:
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

class CourseService:
    @classmethod
    def initialize_database(cls):
        """
        Seeds courses and lessons if missing.
        """
        db = db_instance.get_db()
        if db is not None:
            # Seed Courses if empty
            if db["courses"].count_documents({}) == 0:
                courses_to_insert = []
                for c in INITIAL_COURSES:
                    c_copy = dict(c)
                    c_copy["created_at"] = datetime.utcnow()
                    c_copy["updated_at"] = datetime.utcnow()
                    courses_to_insert.append(c_copy)
                db["courses"].insert_many(courses_to_insert)

            # Seed Lessons if empty
            if db["lessons"].count_documents({}) == 0:
                lessons_to_insert = []
                for l in INITIAL_LESSONS:
                    l_copy = dict(l)
                    l_copy["created_at"] = datetime.utcnow()
                    lessons_to_insert.append(l_copy)
                db["lessons"].insert_many(lessons_to_insert)
        else:
            # Local fallback JSON
            courses = load_mock_data(MOCK_COURSES_FILE)
            if not courses:
                courses = []
                for c in INITIAL_COURSES:
                    c_copy = dict(c)
                    c_copy["created_at"] = datetime.utcnow().isoformat()
                    c_copy["updated_at"] = datetime.utcnow().isoformat()
                    courses.append(c_copy)
                save_mock_data(MOCK_COURSES_FILE, courses)

            lessons = load_mock_data(MOCK_LESSONS_FILE)
            if not lessons:
                lessons = []
                for l in INITIAL_LESSONS:
                    l_copy = dict(l)
                    l_copy["created_at"] = datetime.utcnow().isoformat()
                    lessons.append(l_copy)
                save_mock_data(MOCK_LESSONS_FILE, lessons)

    @classmethod
    def get_courses(
        cls,
        category_id: Optional[str] = None,
        skill_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        learning_mode: Optional[str] = None,
        search_query: Optional[str] = None,
        lang: Optional[str] = "en"
    ) -> List[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        courses = []

        if db is not None:
            query = {"is_active": True}
            if category_id:
                query["category_id"] = category_id
            if skill_id:
                query["skill_id"] = skill_id
            if difficulty:
                query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
            if learning_mode:
                query["learning_mode"] = {"$regex": f"^{learning_mode}$", "$options": "i"}

            db_courses = list(db["courses"].find(query))
            for c in db_courses:
                c["id"] = str(c.get("id") or c.get("_id"))
                if "_id" in c:
                    del c["_id"]
                if "created_at" in c and isinstance(c["created_at"], datetime):
                    c["created_at"] = c["created_at"].isoformat()
                if "updated_at" in c and isinstance(c["updated_at"], datetime):
                    c["updated_at"] = c["updated_at"].isoformat()
                courses.append(c)
        else:
            all_courses = load_mock_data(MOCK_COURSES_FILE)
            for c in all_courses:
                if not c.get("is_active", True):
                    continue
                if category_id and c.get("category_id") != category_id:
                    continue
                if skill_id and c.get("skill_id") != skill_id:
                    continue
                if difficulty and c.get("difficulty", "").lower() != difficulty.lower():
                    continue
                if learning_mode and c.get("learning_mode", "").lower() != learning_mode.lower():
                    continue
                courses.append(c)

        # Apply translations
        processed_courses = [cls._apply_course_translation(c, lang) for c in courses]

        # Implement backend search filtering
        if search_query:
            sq = search_query.strip().lower()
            filtered_courses = []
            for c in processed_courses:
                name_match = sq in c.get("title", "").lower()
                desc_match = sq in c.get("description", "").lower()
                inst_match = sq in c.get("instructor", "").lower()
                outcome_match = any(sq in outcome.lower() for outcome in c.get("career_outcomes", []))

                if name_match or desc_match or inst_match or outcome_match:
                    filtered_courses.append(c)
            return filtered_courses

        return processed_courses

    @classmethod
    def get_course_by_id(cls, course_id: str, lang: Optional[str] = "en") -> Optional[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        course = None

        if db is not None:
            course = db["courses"].find_one({"id": course_id, "is_active": True})
            if course:
                course["id"] = str(course.get("id") or course.get("_id"))
                if "_id" in course:
                    del course["_id"]
                if "created_at" in course and isinstance(course["created_at"], datetime):
                    course["created_at"] = course["created_at"].isoformat()
                if "updated_at" in course and isinstance(course["updated_at"], datetime):
                    course["updated_at"] = course["updated_at"].isoformat()
        else:
            courses = load_mock_data(MOCK_COURSES_FILE)
            for c in courses:
                if c.get("id") == course_id and c.get("is_active", True):
                    course = c
                    break

        if course:
            return cls._apply_course_translation(course, lang)
        return None

    @classmethod
    def get_lessons_for_course(cls, course_id: str) -> List[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        lessons = []

        if db is not None:
            db_lessons = list(db["lessons"].find({"course_id": course_id}).sort("lesson_number", 1))
            for l in db_lessons:
                l["id"] = str(l.get("id") or l.get("_id"))
                if "_id" in l:
                    del l["_id"]
                if "created_at" in l and isinstance(l["created_at"], datetime):
                    l["created_at"] = l["created_at"].isoformat()
                lessons.append(l)
        else:
            all_lessons = load_mock_data(MOCK_LESSONS_FILE)
            for l in all_lessons:
                if l.get("course_id") == course_id:
                    lessons.append(l)
            lessons.sort(key=lambda x: x.get("lesson_number", 1))

        return lessons

    @classmethod
    def get_lesson_by_id(cls, course_id: str, lesson_id: str) -> Optional[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        lesson = None

        if db is not None:
            lesson = db["lessons"].find_one({"course_id": course_id, "id": lesson_id})
            if lesson:
                lesson["id"] = str(lesson.get("id") or lesson.get("_id"))
                if "_id" in lesson:
                    del lesson["_id"]
                if "created_at" in lesson and isinstance(lesson["created_at"], datetime):
                    lesson["created_at"] = lesson["created_at"].isoformat()
        else:
            all_lessons = load_mock_data(MOCK_LESSONS_FILE)
            for l in all_lessons:
                if l.get("course_id") == course_id and l.get("id") == lesson_id:
                    lesson = l
                    break
        return lesson

    @classmethod
    def get_personalized_recommendations(cls, profile: Dict[str, Any], lang: Optional[str] = "en") -> List[Dict[str, Any]]:
        """
        Calculates preliminary personalized course recommendations matching learner's profile parameters.
        """
        all_courses = cls.get_courses(lang=lang)
        recommended = []

        interests = [i.strip().lower() for i in profile.get("learning_interests" or [], [])]
        preferred_mode = (profile.get("learning_preference") or "online").lower()
        career_goal = (profile.get("career_goal") or "").lower()

        for c in all_courses:
            score = 0
            title_lower = c.get("title", "").lower()
            desc_lower = c.get("description", "").lower()
            cat_id = c.get("category_id", "").lower()
            mode = c.get("learning_mode", "").lower()

            # 1. Matching learning mode preference
            if preferred_mode == mode:
                score += 3
            elif preferred_mode == "hybrid" and mode in ["online", "offline"]:
                score += 1

            # 2. Matching selected interest domains
            for interest in interests:
                if interest in title_lower or interest in desc_lower or interest in cat_id:
                    score += 4

            # 3. Match career goal phrases
            if "entrepreneur" in career_goal or "business" in career_goal:
                if cat_id in ["entrepreneurship", "tailoring-fashion", "food-catering"]:
                    score += 2
                if "basics" in title_lower or "setup" in title_lower:
                    score += 1
            elif "freelance" in career_goal:
                if cat_id in ["tailoring-fashion", "handicrafts", "beauty-wellness"]:
                    score += 2
            elif "employment" in career_goal or "job" in career_goal:
                if cat_id in ["digital-skills", "healthcare-caregiving"]:
                    score += 2

            if score > 0:
                recommended.append((c, score))

        recommended.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in recommended[:3]]

    @staticmethod
    def _apply_course_translation(course: Dict[str, Any], lang: Optional[str]) -> Dict[str, Any]:
        if not lang or lang == "en":
            return course
        
        translations = course.get("translations", {})
        if lang in translations:
            lang_data = translations[lang]
            translated_course = dict(course)
            for k, v in lang_data.items():
                translated_course[k] = v
            return translated_course
        return course
