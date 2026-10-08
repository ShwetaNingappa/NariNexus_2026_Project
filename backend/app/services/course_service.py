import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.core.database import db_instance
import time

_GEMINI_COOLDOWN_UNTIL = 0.0

MOCK_COURSES_FILE = os.path.join(os.path.dirname(__file__), "mock_courses.json")
MOCK_LESSONS_FILE = os.path.join(os.path.dirname(__file__), "mock_lessons.json")

INITIAL_COURSES = [
    # COURSE 1: Basic Tailoring & Stitching
    {
        "id": "basic-tailoring-stitching",
        "title": "Basic Tailoring & Stitching",
        "description": "Learn the fundamentals of tailoring and stitching, including understanding sewing tools, fabric selection, basic measurements, cutting techniques, machine operation, and stitching simple garments. This course is designed to help rural rural women develop practical tailoring skills that can be used for employment, home-based work, or starting a small tailoring business.",
        "skill_id": "basic-stitching",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "12 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Lakshmi Devendra",
        "prerequisites": ["None"],
        "career_outcomes": ["Home Tailor", "Boutique Owner", "Garment Assistant"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-yelahanka",
        "online_training": {
            "videos": [
                {
                    "title": "Basic Tailoring Class for Beginners",
                    "youtube_url": "https://www.youtube.com/watch?v=5RBvvBcN0Z8",
                    "description": "Beginner-friendly tailoring and stitching tutorial covering measurements, cutting, sewing-machine basics and garment stitching.",
                    "order": 1
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಮೂಲ ಹೊಲಿಗೆ ಮತ್ತು ಕತ್ತರಿಸುವುದು",
                "description": "ಹೊಲಿಗೆ ಮತ್ತು ಕತ್ತರಿಸುವಿಕೆಯ ಮೂಲಭೂತ ಅಂಶಗಳನ್ನು ಕಲಿಯಿರಿ, ಉಡುಪುಗಳ ವಿನ್ಯಾಸ, ಹೊಲಿಗೆ ಯಂತ್ರ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಸರಳ ಉಡುಪುಗಳ ಹೊಲಿಗೆ ತರಬೇತಿ."
            }
        }
    },
    # COURSE 2: Advanced Dress Designing
    {
        "id": "advanced-dress-designing",
        "title": "Advanced Dress Designing",
        "description": "Develop advanced garment design skills including pattern preparation, neckline and sleeve designs, dress construction, finishing techniques, and basic fashion design principles.",
        "skill_id": "blouse-salwar-stitching",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "8 Weeks",
        "learning_mode": "offline",
        "instructor": "Priya Hegde",
        "prerequisites": ["Basic Stitching & Alterations"],
        "career_outcomes": ["Boutique Designer", "Pattern Cutter", "Independent Seamstress"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-mysuru-shakti",
        "online_training": {
            "videos": []
        },
        "translations": {
            "kn": {
                "title": "ಸುಧಾರಿತ ಉಡುಗೆ ವಿನ್ಯಾಸ",
                "description": "ಮಾದರಿ ತಯಾರಿ, ಕತ್ತಿನ ಮತ್ತು ತೋಳಿನ ವಿನ್ಯಾಸಗಳು, ಉಡುಪುಗಳ ನಿರ್ಮಾಣ ಮತ್ತು ಸೃಜನಾತ್ಮಕ ವಿನ್ಯಾಸ ಸೇರಿದಂತೆ ಸುಧಾರಿತ ಉಡುಗೆ ವಿನ್ಯಾಸ ಕೌಶಲ್ಯಗಳನ್ನು ಅಭಿವೃದ್ಧಿಪಡಿಸಿ."
            }
        }
    },
    # COURSE 3: Digital Literacy for Women
    {
        "id": "digital-literacy-women",
        "title": "Digital Literacy for Women",
        "description": "Learn essential digital skills including computer basics, internet usage, online communication, digital documents, safe browsing, and basic online services.",
        "skill_id": "computer-literacy",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "online",
        "instructor": "Asha Kulkarni",
        "prerequisites": ["None"],
        "career_outcomes": ["Data Entry Specialist", "Office Assistant", "Smart Shop Operator"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-yelahanka",
        "online_training": {
            "videos": [
                {
                    "title": "Introduction to Computers & Digital Literacy – Beginner Course",
                    "youtube_url": "https://www.youtube.com/watch?v=8fCQ_ZuL2TY",
                    "description": "Beginner-friendly digital literacy training covering computers, internet, email, security and basic digital skills.",
                    "order": 1
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಮಹಿಳೆಯರಿಗಾಗಿ ಡಿಜಿಟಲ್ ಸಾಕ್ಷರತೆ",
                "description": "ಕಂಪ್ಯೂಟರ್ ಮೂಲಗಳು, ಇಂಟರ್ನೆಟ್ ಬಳಕೆ, ಆನ್‌ಲೈನ್ ಸಂವಹನ, ಸುರಕ್ಷಿತ ಬ್ರೌಸಿಂಗ್ ಮತ್ತು ಡಿಜಿಟಲ್ ಸೇವೆಗಳು ಸೇರಿದಂತೆ ಅಗತ್ಯ ಡಿಜಿಟಲ್ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    # COURSE 4: Mobile Payments & UPI Skills
    {
        "id": "mobile-payments-upi",
        "title": "Mobile Payments & UPI Skills",
        "description": "Learn how to safely use mobile payment applications, UPI, QR codes, bank transfers, transaction verification, and basic digital financial safety.",
        "skill_id": "digital-payments",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "2 Weeks",
        "learning_mode": "online",
        "instructor": "Deepika Rao",
        "prerequisites": ["Basic Smartphone Usage"],
        "career_outcomes": ["Digital Payments Facilitator", "Smart Retail Associate", "Community Payment Guide"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-yelahanka",
        "online_training": {
            "videos": []
        },
        "translations": {
            "kn": {
                "title": "ಮೊಬೈಲ್ ಪಾವತಿಗಳು ಮತ್ತು ಯುಪಿಐ ಕೌಶಲ್ಯಗಳು",
                "description": "ಮೊಬೈಲ್ ಪಾವತಿ ಅಪ್ಲಿಕೇಶನ್‌ಗಳು, ಯುಪಿಐ, ಕ್ಯೂಆರ್ ಕೋಡ್‌ಗಳು ಮತ್ತು ಸುರಕ್ಷಿತ ಡಿಜಿಟಲ್ ಪಾವತಿ ವಿಧಾನಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    # COURSE 5: Embroidery & Handicrafts
    {
        "id": "embroidery-handicrafts",
        "title": "Embroidery & Handicrafts",
        "description": "Learn traditional and modern embroidery techniques and create handmade products that can be sold locally or through online marketplaces.",
        "skill_id": "embroidery-crochet",
        "category_id": "handicrafts",
        "thumbnail": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "6 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Savitha Gowda",
        "prerequisites": ["None"],
        "career_outcomes": ["Handicraft Creator", "Embroidery Entrepreneur", "Home-based Crafter"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-mandya",
        "online_training": {
            "videos": [
                {
                    "title": "Hand Embroidery for Beginners - Part 1",
                    "youtube_url": "https://www.youtube.com/watch?v=vf_jFr6sC-o",
                    "description": "Beginner hand embroidery training covering preparation, embroidery tools, floss and starting stitches.",
                    "order": 1
                },
                {
                    "title": "Hand Embroidery for Beginners - Part 2: 10 Basic Stitches",
                    "youtube_url": "https://www.youtube.com/watch?v=kKnBUa4l2k4",
                    "description": "Introduction to ten foundational hand embroidery stitches.",
                    "order": 2
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಕಸೂತಿ ಮತ್ತು ಕರಕುಶಲ ಕಲೆ",
                "description": "ಸಾಂಪ್ರದಾಯಿಕ ಮತ್ತು ಆಧುನಿಕ ಕಸೂತಿ ತಂತ್ರಗಳನ್ನು ಕಲಿಯಿರಿ ಮತ್ತು ಸ್ಥಳೀಯವಾಗಿ ಅಥವಾ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಮಾರಾಟ ಮಾಡಬಹುದಾದ ಕರಕುಶಲ ವಸ್ತುಗಳನ್ನು ರಚಿಸಿ."
            }
        }
    },
    # COURSE 6: Beauty & Personal Care
    {
        "id": "beauty-personal-care-course",
        "title": "Beauty & Personal Care",
        "description": "Learn basic beauty and personal-care skills including skincare, hair care, hygiene, basic makeup, and salon service fundamentals.",
        "skill_id": "beauty-personal-care",
        "category_id": "beauty-wellness",
        "thumbnail": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "6 Weeks",
        "learning_mode": "offline",
        "instructor": "Reena D'Souza",
        "prerequisites": ["None"],
        "career_outcomes": ["Beautician", "Salon Assistant", "Freelance Beauty Stylist"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-bengaluru-shakti",
        "online_training": {
            "videos": []
        },
        "translations": {
            "kn": {
                "title": "ಸೌಂದರ್ಯ ಮತ್ತು ವೈಯಕ್ತಿಕ ಆರೈಕೆ",
                "description": "ತ್ವಚೆಯ ಆರೈಕೆ, ಕೂದಲಿನ ಆರೈಕೆ, ನೈರ್ಮಲ್ಯ ಮತ್ತು ಮೂಲ ಮೇಕಪ್ ಸೇರಿದಂತೆ ಸೌಂದರ್ಯ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    # COURSE 7: Small Business & Micro-Accounting
    {
        "id": "small-business-accounting",
        "title": "Small Business & Micro-Accounting",
        "description": "Learn the basics of managing a small business, maintaining simple financial records, calculating expenses and profits, managing inventory, and understanding basic business planning.",
        "skill_id": "micro-bookkeeping",
        "category_id": "entrepreneurship",
        "thumbnail": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "4 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Mangala Gowri",
        "prerequisites": ["Basic Math and Literacy"],
        "career_outcomes": ["Micro-Enterprise Bookkeeper", "Small Business Owner", "Inventory Coordinator"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-tumakuru",
        "online_training": {
            "videos": [
                {
                    "title": "Bookkeeping Basics for Beginners",
                    "youtube_url": "https://www.youtube.com/watch?v=pKpdibyljR4",
                    "description": "Beginner bookkeeping tutorial explaining how financial transactions are recorded and organized for a small business.",
                    "order": 1
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಸಣ್ಣ ಉದ್ಯಮ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಲೆಕ್ಕಪತ್ರ ನಿರ್ವಹಣೆ",
                "description": "ಸಣ್ಣ ಉದ್ಯಮ ನಿರ್ವಹಣೆ, ಸರಳ ಹಣಕಾಸು ದಾಖಲೆಗಳ ನಿರ್ವಹಣೆ, ವೆಚ್ಚ ಮತ್ತು ಲಾಭದ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    # COURSE 8: Handmade Craft Entrepreneurship
    {
        "id": "handmade-craft-entrepreneurship",
        "title": "Handmade Craft Entrepreneurship",
        "description": "Learn how to turn handmade craft skills into a small income-generating business through product development, pricing, packaging, customer interaction, and local marketing.",
        "skill_id": "online-shop-setup",
        "category_id": "entrepreneurship",
        "thumbnail": "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80",
        "difficulty": "intermediate",
        "duration": "6 Weeks",
        "learning_mode": "offline",
        "instructor": "Sudha Murthy",
        "prerequisites": ["None"],
        "career_outcomes": ["Handicrafts Business Owner", "Micro-Retailer", "Local Craft Marketer"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-mysuru-mahila",
        "online_training": {
            "videos": []
        },
        "translations": {
            "kn": {
                "title": "ಕರಕುಶಲ ಉದ್ಯಮಶೀಲತೆ",
                "description": "ಉತ್ಪನ್ನ ಅಭಿವೃದ್ಧಿ, ಬೆಲೆ ನಿಗದಿ, ಪ್ಯಾಕೇಜಿಂಗ್ ಮತ್ತು ಸ್ಥಳೀಯ ಮಾರ್ಕೆಟಿಂಗ್ ಮೂಲಕ ಕರಕುಶಲ ಕೌಶಲ್ಯಗಳನ್ನು ಆದಾಯ ಗಳಿಸುವ ವ್ಯವಹಾರವಾಗಿ ಪರಿವರ್ತಿಸುವುದು ಹೇಗೆ ಎಂದು ತಿಳಿಯಿರಿ."
            }
        }
    },
    # COURSE 9: Computer Basics for Beginners
    {
        "id": "computer-basics-beginners",
        "title": "Computer Basics for Beginners",
        "description": "Learn computer fundamentals, file management, typing, internet usage, online forms, email, and basic digital productivity tools.",
        "skill_id": "computer-literacy",
        "category_id": "digital-skills",
        "thumbnail": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "online",
        "instructor": "Kavitha Shridhar",
        "prerequisites": ["None"],
        "career_outcomes": ["Office Assistant", "Data Entry Coordinator", "Smart Business Assistant"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-yelahanka",
        "online_training": {
            "videos": [
                {
                    "title": "Basic Computer Course – Full Course for Beginners",
                    "youtube_url": "https://www.youtube.com/watch?v=kmmf-HdWark",
                    "description": "Beginner computer course covering computer fundamentals, operating systems, file management, internet basics and essential computer skills.",
                    "order": 1
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಆರಂಭಿಕರಿಗಾಗಿ ಕಂಪ್ಯೂಟರ್ ಮೂಲ ಶಿಕ್ಷಣ",
                "description": "ಕಂಪ್ಯೂಟರ್ ಮೂಲಭೂತ ವಿಷಯಗಳು, ಫೈಲ್ ನಿರ್ವಹಣೆ, ಟೈಪಿಂಗ್, ಇಂಟರ್ನೆಟ್ ಮತ್ತು ಇಮೇಲ್ ಬಳಕೆಯನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    },
    # COURSE 10: Sewing Machine Operation
    {
        "id": "sewing-machine-operation",
        "title": "Sewing Machine Operation",
        "description": "Learn how to safely operate and maintain a sewing machine and develop practical stitching skills.",
        "skill_id": "basic-stitching",
        "category_id": "tailoring-fashion",
        "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "difficulty": "beginner",
        "duration": "4 Weeks",
        "learning_mode": "offline",
        "instructor": "Shobha Devi",
        "prerequisites": ["None"],
        "career_outcomes": ["Sewing Machine Operator", "Alterations Specialist", "Factory Tailor"],
        "language": "en",
        "is_active": True,
        "centre_id": "centre-bengaluru-tailoring",
        "online_training": {
            "videos": [
                {
                    "title": "How to Use a Sewing Machine From Scratch",
                    "youtube_url": "https://www.youtube.com/watch?v=HhHLwCBFVqk",
                    "description": "Beginner tutorial covering sewing-machine parts, threading, preparation, stitch control and basic sewing exercises.",
                    "order": 1
                }
            ]
        },
        "translations": {
            "kn": {
                "title": "ಹೊಲಿಗೆ ಯಂತ್ರ ಕಾರ್ಯಾಚರಣೆ ತರಬೇತಿ",
                "description": "ಹೊಲಿಗೆ ಯಂತ್ರವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸುವುದು, ನಿರ್ವಹಣೆ ಮಾಡುವುದು ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಹೊಲಿಗೆ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ."
            }
        }
    }
]

INITIAL_LESSONS = [
    # Lessons for Course 1: basic-tailoring-stitching (8 lessons)
    {
        "id": "les-tailoring-1",
        "course_id": "basic-tailoring-stitching",
        "title": "Introduction to Tailoring",
        "description": "Welcome to tailoring! Learn about the industry, income opportunities, and basic goals of this vocational program.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-tailoring-2",
        "course_id": "basic-tailoring-stitching",
        "title": "Sewing Tools and Equipment",
        "description": "Get to know the essential tools: measuring tapes, chalks, fabric shears, pins, and thread spools.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "12 mins",
        "is_preview": True
    },
    {
        "id": "les-tailoring-3",
        "course_id": "basic-tailoring-stitching",
        "title": "Taking Body Measurements",
        "description": "Learn the step-by-step method to record correct body measurements for blouses, kurtis, and salwar suits.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "18 mins",
        "is_preview": True
    },
    {
        "id": "les-tailoring-4",
        "course_id": "basic-tailoring-stitching",
        "title": "Fabric Selection",
        "description": "Understand different fabric weaves (cotton, silk, synthetic) and how to select the right material for various garments.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "10 mins",
        "is_preview": False
    },
    {
        "id": "les-tailoring-5",
        "course_id": "basic-tailoring-stitching",
        "title": "Basic Cutting Techniques",
        "description": "Master marking patterns on fabric and cutting them with high accuracy to minimize fabric waste.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-tailoring-6",
        "course_id": "basic-tailoring-stitching",
        "title": "Sewing Machine Basics",
        "description": "Learn bobbin winding, needle placement, threading path lines, and basic machine maintenance.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "20 mins",
        "is_preview": False
    },
    {
        "id": "les-tailoring-7",
        "course_id": "basic-tailoring-stitching",
        "title": "Basic Stitching Techniques",
        "description": "Practice straight seams, curved stitches, reverse sewing locks, and folding hemlines correctly.",
        "lesson_number": 7,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=UscQf4XmE9U",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-tailoring-8",
        "course_id": "basic-tailoring-stitching",
        "title": "Making a Simple Garment",
        "description": "Put everything together by designing, cutting, and stitching a basic baby frock or simple apron.",
        "lesson_number": 8,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=N_p3A-Kx5tA",
        "duration": "25 mins",
        "is_preview": False
    },

    # Lessons for Course 3: digital-literacy-women (8 lessons)
    {
        "id": "les-digital-1",
        "course_id": "digital-literacy-women",
        "title": "Introduction to Computers",
        "description": "Learn what computers are, identify the monitor, CPU, keyboard, mouse, and understand hardware vs software.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-digital-2",
        "course_id": "digital-literacy-women",
        "title": "Keyboard and Mouse Skills",
        "description": "Practice left and right clicking, drag-and-drop, and typing basic alphabets and numbers systematically.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "12 mins",
        "is_preview": True
    },
    {
        "id": "les-digital-3",
        "course_id": "digital-literacy-women",
        "title": "Internet Basics",
        "description": "Understand what the internet is, how to use Google Chrome, and search for information online.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "10 mins",
        "is_preview": True
    },
    {
        "id": "les-digital-4",
        "course_id": "digital-literacy-women",
        "title": "Creating Digital Documents",
        "description": "Learn how to open a word processor, type letters, format text sizes, and save documents safely in folders.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-digital-5",
        "course_id": "digital-literacy-women",
        "title": "Email Basics",
        "description": "Create your first Gmail account, learn how to read emails, write subject lines, and compose reply messages.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "14 mins",
        "is_preview": False
    },
    {
        "id": "les-digital-6",
        "course_id": "digital-literacy-women",
        "title": "Online Safety",
        "description": "Avoid digital threats: learn to identify secure websites (HTTPS), create strong passwords, and spot online scams.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=UscQf4XmE9U",
        "duration": "12 mins",
        "is_preview": False
    },
    {
        "id": "les-digital-7",
        "course_id": "digital-literacy-women",
        "title": "Government Digital Services",
        "description": "Access useful public services online: learn about Aadhaar details, Ration card portals, and utility bill payments.",
        "lesson_number": 7,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-digital-8",
        "course_id": "digital-literacy-women",
        "title": "Digital Communication",
        "description": "Learn to use WhatsApp Web, Google Meet, and online messaging tools to connect with family and clients.",
        "lesson_number": 8,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=N_p3A-Kx5tA",
        "duration": "10 mins",
        "is_preview": False
    },

    # Lessons for Course 4: mobile-payments-upi (7 lessons)
    {
        "id": "les-payments-1",
        "course_id": "mobile-payments-upi",
        "title": "Introduction to Digital Payments",
        "description": "Understand physical currency vs digital money and how mobile wallets are transforming trade in India.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "10 mins",
        "is_preview": True
    },
    {
        "id": "les-payments-2",
        "course_id": "mobile-payments-upi",
        "title": "Understanding UPI",
        "description": "What is the Unified Payments Interface? Learn how instant bank-to-bank transfers operate.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "11 mins",
        "is_preview": True
    },
    {
        "id": "les-payments-3",
        "course_id": "mobile-payments-upi",
        "title": "Creating a UPI Payment",
        "description": "Step-by-step setup on BHIM or Google Pay, setting your secure UPI PIN, and checking balance.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-payments-4",
        "course_id": "mobile-payments-upi",
        "title": "Scanning QR Codes",
        "description": "Learn how to use your phone's camera to scan shop QR codes and verify the merchant name on screen.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "10 mins",
        "is_preview": False
    },
    {
        "id": "les-payments-5",
        "course_id": "mobile-payments-upi",
        "title": "Checking Transactions",
        "description": "Verify transfers in history feeds and learn how bank SMS statements prove payments were received.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "12 mins",
        "is_preview": False
    },
    {
        "id": "les-payments-6",
        "course_id": "mobile-payments-upi",
        "title": "Avoiding Digital Payment Fraud",
        "description": "Golden rules: No UPI PIN is needed to receive money, avoid clicking suspicious SMS claim links.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-payments-7",
        "course_id": "mobile-payments-upi",
        "title": "Safe Banking Practices",
        "description": "Protect your mobile: set screen locks, hide passwords, and contact your bank if you lose your phone.",
        "lesson_number": 7,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=UscQf4XmE9U",
        "duration": "10 mins",
        "is_preview": False
    },

    # Lessons for Course 5: embroidery-handicrafts (6 lessons)
    {
        "id": "les-embroidery-1",
        "course_id": "embroidery-handicrafts",
        "title": "Introduction to Embroidery",
        "description": "Learn about the heritage of local hand embroidery, product types, and marketing handcrafted goods.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-embroidery-2",
        "course_id": "embroidery-handicrafts",
        "title": "Tools and Materials",
        "description": "Explore embroidery hoops, needles sizes, colorful skeins of threads, fabric bases, and designs copying paper.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "10 mins",
        "is_preview": True
    },
    {
        "id": "les-embroidery-3",
        "course_id": "embroidery-handicrafts",
        "title": "Basic Embroidery Stitches",
        "description": "Practice the running stitch, back stitch, split stitch, and stem stitch on test cotton fabric.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "20 mins",
        "is_preview": True
    },
    {
        "id": "les-embroidery-4",
        "course_id": "embroidery-handicrafts",
        "title": "Floral Designs",
        "description": "Stitch beautiful lazy daisy petals, french knots, and satin stitch leaves to create flowers.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "18 mins",
        "is_preview": False
    },
    {
        "id": "les-embroidery-5",
        "course_id": "embroidery-handicrafts",
        "title": "Decorative Patterns",
        "description": "Stitch border patterns: learn the chain stitch, blanket stitch, and herringbone styles for dress necklines.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-embroidery-6",
        "course_id": "embroidery-handicrafts",
        "title": "Product Finishing",
        "description": "Learn washing, ironing, hiding rear knots, and framing or stitching embroidered fabrics into sellable pillow covers.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "15 mins",
        "is_preview": False
    },

    # Lessons for Course 7: small-business-accounting (6 lessons)
    {
        "id": "les-accounting-1",
        "course_id": "small-business-accounting",
        "title": "Introduction to Small Business",
        "description": "Understand core enterprise traits, planning raw material cycles, and setting healthy business goals.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-accounting-2",
        "course_id": "small-business-accounting",
        "title": "Understanding Income and Expenses",
        "description": "Learn to classify raw materials, transport, packaging vs customer fees and stitching charges.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "12 mins",
        "is_preview": True
    },
    {
        "id": "les-accounting-3",
        "course_id": "small-business-accounting",
        "title": "Maintaining Daily Records",
        "description": "Create a daily ledger notebook: track physical cash inflows and cash outflows systematically.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "18 mins",
        "is_preview": True
    },
    {
        "id": "les-accounting-4",
        "course_id": "small-business-accounting",
        "title": "Calculating Profit",
        "description": "Formulas to find net profit: subtract raw materials and logistics costs from overall receipts.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "14 mins",
        "is_preview": False
    },
    {
        "id": "les-accounting-5",
        "course_id": "small-business-accounting",
        "title": "Inventory Management",
        "description": "Learn to log thread cones, fabric meters, and sewing needles to prevent running out of stock mid-project.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-accounting-6",
        "course_id": "small-business-accounting",
        "title": "Basic Business Planning",
        "description": "Plan your monthly budget, save reserves for machine repairs, and set aside funds for local stall stalls.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "20 mins",
        "is_preview": False
    },

    # Lessons for Course 9: computer-basics-beginners (7 lessons)
    {
        "id": "les-comp-1",
        "course_id": "computer-basics-beginners",
        "title": "Computer Fundamentals",
        "description": "Learn how computers boot up, how to interact with screen desktops, and locate storage drives.",
        "lesson_number": 1,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=NVQVz4O6E6I",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-comp-2",
        "course_id": "computer-basics-beginners",
        "title": "Keyboard and Mouse",
        "description": "Master typing layout, left-click, right-click, scrolling, and safe device handling.",
        "lesson_number": 2,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=18u8F9Gf8M0",
        "duration": "10 mins",
        "is_preview": True
    },
    {
        "id": "les-comp-3",
        "course_id": "computer-basics-beginners",
        "title": "Files and Folders",
        "description": "Organize your business files: create folders, rename documents, and move client files successfully.",
        "lesson_number": 3,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=zPKeX0bS-iE",
        "duration": "15 mins",
        "is_preview": True
    },
    {
        "id": "les-comp-4",
        "course_id": "computer-basics-beginners",
        "title": "Internet Basics",
        "description": "How to search using Google, bookmark useful portals, and access basic web resources safely.",
        "lesson_number": 4,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=gS67xM2n8G8",
        "duration": "12 mins",
        "is_preview": False
    },
    {
        "id": "les-comp-5",
        "course_id": "computer-basics-beginners",
        "title": "Email",
        "description": "Setup an email account, receive customer attachments, and send professional email invoices.",
        "lesson_number": 5,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=fpxnFfPZf-8",
        "duration": "18 mins",
        "is_preview": False
    },
    {
        "id": "les-comp-6",
        "course_id": "computer-basics-beginners",
        "title": "Online Forms",
        "description": "Learn to fill online registrations, apply for state enterprise licenses, and type details in web forms.",
        "lesson_number": 6,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=SPh8W6p6l1c",
        "duration": "15 mins",
        "is_preview": False
    },
    {
        "id": "les-comp-7",
        "course_id": "computer-basics-beginners",
        "title": "Digital Safety",
        "description": "Learn about strong passwords, OTP safety rules, and never sharing account details with strangers.",
        "lesson_number": 7,
        "content_type": "video",
        "content": "https://www.youtube.com/watch?v=UscQf4XmE9U",
        "duration": "15 mins",
        "is_preview": False
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
            import re
            if difficulty:
                safe_difficulty = re.escape(str(difficulty).strip())
                query["difficulty"] = {"$regex": f"^{safe_difficulty}$", "$options": "i"}
            if learning_mode:
                safe_learning_mode = re.escape(str(learning_mode).strip())
                query["learning_mode"] = {"$regex": f"^{safe_learning_mode}$", "$options": "i"}

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
                title_val = str(c.get("title") or "").lower()
                desc_val = str(c.get("description") or "").lower()
                inst_val = str(c.get("instructor") or "").lower()
                
                name_match = sq in title_val
                desc_match = sq in desc_val
                inst_match = sq in inst_val
                
                outcomes = c.get("career_outcomes") or []
                if isinstance(outcomes, str):
                    outcomes = [outcomes]
                outcome_match = any(sq in str(outcome).lower() for outcome in outcomes) if outcomes else False

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
        Calculates highly personalized course recommendations matching learner's profile parameters using Gemini.
        Avoids recommending courses that the learner has already completed or is currently enrolled in,
        and provides localized explanations (English, Kannada, or Hindi).
        """
        user_id = profile.get("id") or profile.get("user_id")
        user_name = profile.get("name") or "Learner"
        interests = profile.get("learning_interests", [])
        existing_skills = profile.get("existing_skills", [])
        experience_level = profile.get("experience_level") or profile.get("skill_level") or "Beginner"
        career_goal = profile.get("career_goal") or ""
        active_lang = lang or profile.get("preferred_language") or "en"

        completed_course_ids = []
        enrolled_course_ids = []
        enroll_str = ""
        
        if user_id:
            try:
                from backend.app.services.enrollment_service import EnrollmentService
                from backend.app.services.progress_service import ProgressService
                enrollments = EnrollmentService.get_learner_enrollments(user_id)
                if enrollments:
                    for e in enrollments:
                        c_id = e.get("course_id")
                        status = e.get("status")
                        prog = ProgressService.get_course_progress(user_id, c_id)
                        percent = prog.get("progress_percentage", 0)
                        
                        if status == "completed" or percent >= 100:
                            completed_course_ids.append(c_id)
                        else:
                            enrolled_course_ids.append(c_id)
                            
                        enroll_str += f"- Course: {e.get('course_title')} (ID: {c_id}), Progress: {percent}%, Status: {status}\n"
                else:
                    enroll_str = "- Not enrolled in any courses yet.\n"
            except Exception as e_err:
                enroll_str = f"Error loading enrollment context: {str(e_err)}\n"

        rec_skills_str = ""
        try:
            from backend.app.services.skill_service import SkillService
            rec_skills = SkillService.get_rule_based_recommendations(profile, lang=active_lang)
            if rec_skills:
                rec_skills_str = ", ".join([s.get("name") for s in rec_skills])
        except Exception:
            pass

        all_courses = cls.get_courses(lang=active_lang)
        courses_pool = []
        for c in all_courses:
            c_id = c.get("id")
            # Filter out already completed courses to prevent recommending them again
            if c_id in completed_course_ids:
                continue
            courses_pool.append({
                "id": c_id,
                "title": c.get("title"),
                "description": c.get("description"),
                "skill_id": c.get("skill_id"),
                "category_id": c.get("category_id"),
                "difficulty": c.get("difficulty"),
                "duration": c.get("duration"),
                "prerequisites": c.get("prerequisites", [])
            })

        try:
            global _GEMINI_COOLDOWN_UNTIL
            now = time.time()
            if now < _GEMINI_COOLDOWN_UNTIL:
                logger.warning(f"Gemini API is in cooldown state due to prior rate limits. Skipping to deterministic fallback.")
                raise RuntimeError("Gemini in active cooldown")

            from backend.app.services.ai_service import AIService
            from google.genai import types
            client = AIService.get_client()
            if client:
                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                ai_response_text = None

                system_instruction = (
                    "You are the NariNexus Personalized Course Recommendation Assistant, an AI matching system for rural women.\n"
                    "Your task is to recommend exactly 3 suitable courses from the actual provided Courses Pool based on the learner's profile.\n"
                    "Your response must be a valid raw JSON array containing exactly 3 objects. Do not include any extra text."
                )

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                    response_mime_type="application/json"
                )

                prompt = (
                    f"Return exactly 3 personalized course recommendations as a JSON array of objects matching the specified schema.\n"
                    f"Learner Profile:\n"
                    f"- Name: {user_name}\n"
                    f"- Preferred Language: {active_lang}\n"
                    f"- Interests: {interests}\n"
                    f"- Existing Skills: {existing_skills}\n"
                    f"- Skill Level: {experience_level}\n"
                    f"- Goals/Career: {career_goal}\n"
                    f"- Recommended Skills: {rec_skills_str}\n"
                    f"- Current Enrollments & Progress:\n{enroll_str}\n\n"
                    f"Courses Pool:\n{json.dumps(courses_pool)}\n\n"
                    f"JSON schema to return:\n"
                    f"[\n"
                    f"  {{\n"
                    f"    \"course_id\": \"course-id\",\n"
                    f"    \"reason\": \"Why this course is recommended in preferred language: {active_lang}\",\n"
                    f"    \"benefit\": \"Livelihood potential / benefit in preferred language: {active_lang}\",\n"
                    f"    \"relevance\": \"High\" or \"Medium\"\n"
                    f"  }}\n"
                    "]"
                )

                for model_name in models_to_try:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=config
                        )
                        if response and response.text:
                            ai_response_text = response.text.strip()
                            break
                    except Exception as err:
                        err_msg = str(err).upper()
                        if "RESOURCE" in err_msg or "429" in err_msg or "QUOTA" in err_msg:
                            logger.error(f"Gemini 429 Rate Limit hit on {model_name}. Cooldown activated. Error: {str(err)}")
                            _GEMINI_COOLDOWN_UNTIL = time.time() + 30.0
                            break
                        else:
                            logger.error(f"Gemini exception on {model_name}: {str(err)}")
                            break

                if ai_response_text:
                    if ai_response_text.startswith("```json"):
                        ai_response_text = ai_response_text[7:]
                    if ai_response_text.endswith("```"):
                        ai_response_text = ai_response_text[:-3]
                    ai_response_text = ai_response_text.strip()

                    rec_list = json.loads(ai_response_text)
                    if isinstance(rec_list, list):
                        from backend.app.services.ai_safety_service import AISafetyService
                        validated_res = AISafetyService.validate_ai_response(
                            {"recommended_courses": rec_list},
                            "course_recommendation",
                            user_id=user_id
                        )
                        rec_list = validated_res.get("recommended_courses", [])

                        final_recommendations = []
                        for r in rec_list:
                            # Try mapping from both ID formats
                            c_id = r.get("id") or r.get("course_id")
                            course_obj = cls.get_course_by_id(c_id, lang=active_lang)
                            if course_obj:
                                if c_id in completed_course_ids:
                                    continue
                                course_obj["reason"] = r.get("reason") or f"Recommended based on your alignment with {experience_level} modules."
                                course_obj["benefit"] = r.get("benefit") or "Provides real-world practical skills to start local self-employment."
                                course_obj["relevance"] = r.get("relevance") or "High"
                                final_recommendations.append(course_obj)
                        if final_recommendations:
                            return final_recommendations[:3]
        except Exception:
            pass

        # Fallback implementation
        rule_recs = []
        interests_lower = [i.strip().lower() for i in interests]
        preferred_mode = (profile.get("learning_preference") or "online").lower()
        career_goal_lower = career_goal.lower()

        for c in all_courses:
            c_id = c.get("id")
            if c_id in completed_course_ids:
                continue

            score = 0
            title_lower = c.get("title", "").lower()
            desc_lower = c.get("description", "").lower()
            cat_id = c.get("category_id", "").lower()
            mode = c.get("learning_mode", "").lower()

            if preferred_mode == mode:
                score += 3
            elif preferred_mode == "hybrid" and mode in ["online", "offline"]:
                score += 1

            for interest in interests_lower:
                if interest in title_lower or interest in desc_lower or interest in cat_id:
                    score += 4

            if "entrepreneur" in career_goal_lower or "business" in career_goal_lower:
                if cat_id in ["entrepreneurship", "tailoring-fashion", "food-catering"]:
                    score += 2
                if "basics" in title_lower or "setup" in title_lower:
                    score += 1

            if rec_skills_str:
                for skill_name in rec_skills_str.split(", "):
                    if skill_name.lower() in title_lower or skill_name.lower() in desc_lower:
                        score += 5

            if score > 0 or len(rule_recs) < 3:
                rule_recs.append((c, score))

        rule_recs.sort(key=lambda x: x[1], reverse=True)
        final_fallback = []
        for c, score in rule_recs[:3]:
            c_title = c.get("title")
            if active_lang == "kn":
                c["reason"] = f"ನಿಮ್ಮ ಆಸಕ್ತಿಗಳು ಮತ್ತು ಪ್ರೊಫೈಲ್ ಆಧರಿಸಿ ಈ {c_title} ಕೋರ್ಸ್ ಅನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ."
                c["benefit"] = "ಸ್ಥಳೀಯವಾಗಿ ಉದ್ಯೋಗ ಪಡೆಯಲು ಅಥವಾ ಸ್ವಯಂ ಉದ್ಯೋಗ ಹೊಂದಲು ಇದು ಸಹಕಾರಿಯಾಗಿದೆ."
                c["relevance"] = "High"
            elif active_lang == "hi":
                c["reason"] = f"आपकी रुचियों और प्रोफाइल के आधार पर {c_title} कोर्स की सिफारिश की जाती है।"
                c["benefit"] = "यह आपको स्थानीय स्तर पर स्वरोजगार या सूक्ष्म उद्यम शुरू करने में सक्षम बनाएगा।"
                c["relevance"] = "High"
            else:
                c["reason"] = f"This course is recommended for you as it directly aligns with your interest in {c_title}."
                c["benefit"] = "Provides practical skills that help build micro-enterprise or local income streams."
                c["relevance"] = "High"
            final_fallback.append(c)
        return final_fallback[:3]

    @staticmethod
    def _apply_course_translation(course: Dict[str, Any], lang: Optional[str]) -> Dict[str, Any]:
        if not lang or lang == "en":
            return course
        
        translations = course.get("translations") or {}
        if isinstance(translations, dict) and lang in translations:
            lang_data = translations[lang]
            translated_course = dict(course)
            for k, v in lang_data.items():
                translated_course[k] = v
            return translated_course
        return course

    @classmethod
    def get_courses_by_centre(cls, centre_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all courses created by/associated with a specific Training Centre (both active and inactive).
        """
        cls.initialize_database()
        db = db_instance.get_db()
        courses = []

        if db is not None:
            db_courses = list(db["courses"].find({"centre_id": centre_id}))
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
                if c.get("centre_id") == centre_id:
                    courses.append(c)
        return courses

    @classmethod
    def get_course_by_id_and_centre(cls, course_id: str, centre_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific course by ID, validating ownership by a specific Training Centre.
        """
        cls.initialize_database()
        db = db_instance.get_db()
        course = None

        if db is not None:
            course = db["courses"].find_one({"id": course_id, "centre_id": centre_id})
            if course:
                course["id"] = str(course.get("id") or course.get("_id"))
                if "_id" in course:
                    del course["_id"]
                if "created_at" in course and isinstance(course["created_at"], datetime):
                    course["created_at"] = course["created_at"].isoformat()
                if "updated_at" in course and isinstance(course["updated_at"], datetime):
                    course["updated_at"] = course["updated_at"].isoformat()
        else:
            all_courses = load_mock_data(MOCK_COURSES_FILE)
            for c in all_courses:
                if c.get("id") == course_id and c.get("centre_id") == centre_id:
                    course = c
                    break
        return course

    @classmethod
    def create_course_by_centre(cls, centre_id: str, course_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new course associated with the specified Training Centre. Validates skill existence.
        """
        cls.initialize_database()
        
        # Skill ID validation
        from backend.app.services.skill_service import SkillService
        skill_id = course_data.get("skill_id")
        skill = SkillService.get_skill_by_id(skill_id)
        if not skill:
            raise ValueError(f"Referenced skill_id '{skill_id}' does not exist.")

        # Assign unique id and ownership fields
        course_id = f"course-centre-{uuid.uuid4().hex[:8]}"
        doc = dict(course_data)
        doc["id"] = course_id
        doc["centre_id"] = centre_id
        
        # Handle visual status mapping for regression compatibility: status 'active' is is_active=True
        status_val = doc.get("status", "active")
        doc["is_active"] = (status_val == "active")

        db = db_instance.get_db()
        if db is not None:
            doc["created_at"] = datetime.utcnow()
            doc["updated_at"] = datetime.utcnow()
            db["courses"].insert_one(doc)
            doc["id"] = str(doc.get("id") or doc.get("_id"))
            if "_id" in doc:
                del doc["_id"]
            if isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            if isinstance(doc["updated_at"], datetime):
                doc["updated_at"] = doc["updated_at"].isoformat()
        else:
            all_courses = load_mock_data(MOCK_COURSES_FILE)
            doc["created_at"] = datetime.utcnow().isoformat()
            doc["updated_at"] = datetime.utcnow().isoformat()
            all_courses.append(doc)
            save_mock_data(MOCK_COURSES_FILE, all_courses)
        
        return doc

    @classmethod
    def update_course_by_centre(cls, course_id: str, centre_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing course's details. Implements course ownership verification and skill validation.
        """
        cls.initialize_database()
        
        # Verify ownership
        existing = cls.get_course_by_id_and_centre(course_id, centre_id)
        if not existing:
            return None

        # Validate skill if changed
        if "skill_id" in update_data:
            from backend.app.services.skill_service import SkillService
            skill_id = update_data["skill_id"]
            skill = SkillService.get_skill_by_id(skill_id)
            if not skill:
                raise ValueError(f"Referenced skill_id '{skill_id}' does not exist.")

        # Filter immutable parameters
        cleaned_update = dict(update_data)
        cleaned_update.pop("id", None)
        cleaned_update.pop("centre_id", None)
        cleaned_update.pop("created_at", None)

        if "status" in cleaned_update:
            cleaned_update["is_active"] = (cleaned_update["status"] == "active")

        db = db_instance.get_db()
        if db is not None:
            cleaned_update["updated_at"] = datetime.utcnow()
            db["courses"].update_one({"id": course_id, "centre_id": centre_id}, {"$set": cleaned_update})
            updated = db["courses"].find_one({"id": course_id, "centre_id": centre_id})
            if updated:
                updated["id"] = str(updated.get("id") or updated.get("_id"))
                if "_id" in updated:
                    del updated["_id"]
                if "created_at" in updated and isinstance(updated["created_at"], datetime):
                    updated["created_at"] = updated["created_at"].isoformat()
                if "updated_at" in updated and isinstance(updated["updated_at"], datetime):
                    updated["updated_at"] = updated["updated_at"].isoformat()
                return updated
        else:
            all_courses = load_mock_data(MOCK_COURSES_FILE)
            for i, c in enumerate(all_courses):
                if c.get("id") == course_id and c.get("centre_id") == centre_id:
                    cleaned_update["updated_at"] = datetime.utcnow().isoformat()
                    all_courses[i].update(cleaned_update)
                    save_mock_data(MOCK_COURSES_FILE, all_courses)
                    return all_courses[i]
        return None

    @classmethod
    def toggle_course_status_by_centre(cls, course_id: str, centre_id: str, status: str) -> Optional[Dict[str, Any]]:
        """
        Safely transition a center course's status and is_active flag.
        """
        if status not in ["active", "inactive", "draft"]:
            raise ValueError("Status must be 'active', 'inactive', or 'draft'")
        return cls.update_course_by_centre(course_id, centre_id, {"status": status})
