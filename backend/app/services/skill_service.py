import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.core.database import db_instance

MOCK_CATEGORIES_FILE = os.path.join(os.path.dirname(__file__), "mock_categories.json")
MOCK_SKILLS_FILE = os.path.join(os.path.dirname(__file__), "mock_skills.json")

# Core seed categories
INITIAL_CATEGORIES = [
    {
        "id": "digital-skills",
        "name": "Digital Skills",
        "description": "Learn to use computers, smartphones, mobile banking, and digital tools for your business.",
        "icon": "Laptop",
        "image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಡಿಜಿಟಲ್ ಕೌಶಲ್ಯಗಳು",
                "description": "ಕಂಪ್ಯೂಟರ್‌ಗಳು, ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ಗಳು, ಮೊಬೈಲ್ ಬ್ಯಾಂಕಿಂಗ್ ಮತ್ತು ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕಾಗಿ ಡಿಜಿಟಲ್ ಪರಿಕರಗಳನ್ನು ಬಳಸಲು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "डिजिटल कौशल",
                "description": "अपने व्यवसाय के लिए कंप्यूटर, स्मार्टफोन, मोबाइल बैंकिंग और डिजिटल टूल्स का उपयोग करना सीखें।"
            }
        },
        "is_active": True
    },
    {
        "id": "handicrafts",
        "name": "Handicrafts",
        "description": "Master local handicraft weaving, embroidery, and clay design to sell beautifully crafted work.",
        "icon": "Palette",
        "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಕರಕುಶಲ ವಸ್ತುಗಳು",
                "description": "ಸುಂದರವಾದ ಕರಕುಶಲ ವಸ್ತುಗಳನ್ನು ಮಾರಾಟ ಮಾಡಲು ಸ್ಥಳೀಯ ನೇಯ್ಗೆ, ಕಸೂತಿ ಮತ್ತು ಜೇಡಿಮಣ್ಣಿನ ವಿನ್ಯಾಸವನ್ನು ಕರಗತ ಮಾಡಿಕೊಳ್ಳಿ."
            },
            "hi": {
                "name": "हस्तशिल्प",
                "description": "खूबसूरत हस्तनिर्मित उत्पाद बेचने के लिए स्थानीय बुनाई, कढ़ाई और मिट्टी के बर्तनों के डिजाइन में महारत हासिल करें।"
            }
        },
        "is_active": True
    },
    {
        "id": "beauty-wellness",
        "name": "Beauty & Wellness",
        "description": "Learn professional makeup artistry, hair styling, skin care, and start your own salon.",
        "icon": "Sparkles",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಸೌಂದರ್ಯ ಮತ್ತು ಸ್ವಾಸ್ಥ್ಯ",
                "description": "ವೃತ್ತಿಪರ ಮೇಕಪ್ ಕಲೆ, ಹೇರ್ ಸ್ಟೈಲಿಂಗ್, ತ್ವಚೆಯ ಆರೈಕೆಯನ್ನು ಕಲಿಯಿರಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಸಲೂನ್ ಅನ್ನು ಪ್ರಾರಂಭಿಸಿ."
            },
            "hi": {
                "name": "सौंदर्य और कल्याण",
                "description": "पेशेवर मेकअप आर्टिस्ट्री, हेयर स्टाइलिंग, त्वचा की देखभाल सीखें और अपना खुद का सैलून शुरू करें।"
            }
        },
        "is_active": True
    },
    {
        "id": "food-catering",
        "name": "Food & Catering",
        "description": "Baking, professional culinary arts, catering, and scaling food delivery ventures.",
        "icon": "UtensilsCrossed",
        "image": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಆಹಾರ ಮತ್ತು ಅಡುಗೆ",
                "description": "ಬೇಕಿಂಗ್, ವೃತ್ತಿಪರ ಪಾಕಶಾಲೆಯ ಕಲೆಗಳು, ಅಡುಗೆ ಸೇವೆಗಳು ಮತ್ತು ಆಹಾರ ವಿತರಣಾ ಉದ್ಯಮಗಳು."
            },
            "hi": {
                "name": "खाद्य और खानपान",
                "description": "बेकिंग, पेशेवर पाक कला, खानपान और भोजन वितरण व्यवसायों का विस्तार।"
            }
        },
        "is_active": True
    },
    {
        "id": "entrepreneurship",
        "name": "Entrepreneurship",
        "description": "Basic bookkeeping, starting e-commerce shops, pitching strategies, and raising microloans.",
        "icon": "TrendingUp",
        "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಉದ್ಯಮಶೀಲತೆ",
                "description": "ಮೂಲ ಬುಕ್ಕೀಪಿಂಗ್, ಇ-ಕಾಮರ್ಸ್ ಅಂಗಡಿಗಳನ್ನು ಪ್ರಾರಂಭಿಸುವುದು, ವ್ಯಾಪಾರ ತಂತ್ರಗಳು ಮತ್ತು ಕಿರುಸಾಲ ಪಡೆಯುವುದು."
            },
            "hi": {
                "name": "उद्यमशीलता",
                "description": "बुनियादी बहीखाता (बुककीपिंग), ई-कॉमर्स स्टोर शुरू करना, व्यावसायिक रणनीतियां और सूक्ष्म ऋण प्राप्त करना।"
            }
        },
        "is_active": True
    },
    {
        "id": "agriculture",
        "name": "Agriculture",
        "description": "Organic vegetable cultivation, kitchen gardening, composting, poultry, and dairy farming.",
        "icon": "Sprout",
        "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಕೃಷಿ",
                "description": "ಸಾವಯವ ತರಕಾರಿ ಬೆಳೆಗಳು, ಅಡುಗೆಮನೆ ತೋಟಗಾರಿಕೆ, ಗೊಬ್ಬರ ತಯಾರಿಕೆ, ಕೋಳಿ ಮತ್ತು ಡೈರಿ ಸಾಕಣೆ."
            },
            "hi": {
                "name": "कृषि",
                "description": "जैविक सब्जी की खेती, किचन गार्डनिंग, जैविक खाद बनाना, मुर्गी पालन और डेयरी फार्मिंग।"
            }
        },
        "is_active": True
    },
    {
        "id": "tailoring-fashion",
        "name": "Tailoring & Fashion",
        "description": "Stitching, garment alterations, bridal blouse embroidery, and starting a boutique brand.",
        "icon": "Scissors",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಕಸೂತಿ ಮತ್ತು ಫ್ಯಾಷನ್",
                "description": "ಹೊಲಿಗೆ, ಬಟ್ಟೆ ಮಾರ್ಪಾಡುಗಳು, ವಧುವಿನ ಬ್ಲೌಸ್ ಕಸೂತಿ ಮತ್ತು ಬೊಟಿಕ್ ಬ್ರ್ಯಾಂಡ್ ಪ್ರಾರಂಭಿಸುವುದು."
            },
            "hi": {
                "name": "सिलाई और फैशन",
                "description": "सिलाई, कपड़ों में बदलाव, ब्राइडल ब्लाउज कढ़ाई और बुटीक ब्रांड की शुरुआत करना।"
            }
        },
        "is_active": True
    },
    {
        "id": "healthcare-caregiving",
        "name": "Healthcare & Caregiving",
        "description": "Elderly nursing, infant childcare, nutrition guidance, and professional first aid training.",
        "icon": "Heart",
        "image": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
        "translations": {
            "kn": {
                "name": "ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಮತ್ತು ಶುಶ್ರೂಷೆ",
                "description": "ವೃದ್ಧರ ಆರೈಕೆ, ಶಿಶು ಪಾಲನೆ, ಪೌಷ್ಟಿಕಾಂಶ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ವೃತ್ತಿಪರ ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ತರಬೇತಿ."
            },
            "hi": {
                "name": "स्वास्थ्य सेवा और देखभाल",
                "description": "बुजुर्गों की देखभाल, शिशु देखभाल, पोषण मार्गदर्शन और पेशेवर प्राथमिक चिकित्सा प्रशिक्षण।"
            }
        },
        "is_active": True
    }
]

# Core seed skills
INITIAL_SKILLS = [
    # Tailoring & Fashion
    {
        "id": "basic-stitching",
        "category_id": "tailoring-fashion",
        "name": "Basic Stitching & Alterations",
        "description": "Learn sewing machine operation, straight stitches, hand sewing stitches, and standard garment alterations.",
        "difficulty": "Beginner",
        "estimated_duration": "4 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Alterations Tailor", "Hobbyist Sewer", "Textile Assortment Assistant"],
        "translations": {
            "kn": {
                "name": "ಮೂಲ ಹೊಲಿಗೆ ಮತ್ತು ಮಾರ್ಪಾಡುಗಳು",
                "description": "ಹೊಲಿಗೆ ಯಂತ್ರ ಕಾರ್ಯಾಚರಣೆ, ನೇರ ಹೊಲಿಗೆಗಳು, ಹ್ಯಾಂಡ್ ಹೊಲಿಗೆಗಳು ಮತ್ತು ಸಾಮಾನ್ಯ ಬಟ್ಟೆ ಮಾರ್ಪಾಡುಗಳನ್ನು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "बुनियादी सिलाई और सुधार",
                "description": "सिलाई मशीन चलाना, सीधी सिलाई, हाथ की सिलाई और सामान्य कपड़ों में सुधार करना सीखें।"
            }
        },
        "is_active": True
    },
    {
        "id": "blouse-salwar-stitching",
        "category_id": "tailoring-fashion",
        "name": "Blouse & Salwar Stitching",
        "description": "Master professional patterns, neck design styling, measurement cutting, and complete lining stitching for standard blouses and salwar suits.",
        "difficulty": "Intermediate",
        "estimated_duration": "8 Weeks",
        "prerequisites": ["Basic Stitching & Alterations"],
        "career_options": ["Independent Blouse Designer", "Boutique Tailor", "Garment Pattern Maker"],
        "translations": {
            "kn": {
                "name": "ಬ್ಲೌಸ್ ಮತ್ತು ಸಲ್ವಾರ್ ಹೊಲಿಗೆ",
                "description": "ವೃತ್ತಿಪರ ಮಾದರಿಗಳು, ಕತ್ತಿನ ವಿನ್ಯಾಸ ಶೈಲಿ, ಅಳತೆ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಲೈನಿಂಗ್ ಹೊಲಿಗೆಯನ್ನು ಕರಗತ ಮಾಡಿಕೊಳ್ಳಿ."
            },
            "hi": {
                "name": "ब्लाउज और सलवार सिलाई",
                "description": "पेशेवर पैटर्न, नेक डिजाइनिंग, माप काटना और ब्लाउज व सलवार सूट की सिलाई में महारत हासिल करें।"
            }
        },
        "is_active": True
    },
    {
        "id": "bridal-embroidery",
        "category_id": "tailoring-fashion",
        "name": "Creative Dressmaking & Embroidery",
        "description": "Advanced wedding dressmaking, Zardosi stitches, bridal hand embroidery patterns, beads hooking, and custom boutique creations.",
        "difficulty": "Advanced",
        "estimated_duration": "12 Weeks",
        "prerequisites": ["Blouse & Salwar Stitching"],
        "career_options": ["Bridal Wear Specialist", "Boutique Entrepreneur", "Master Embroidery Coach"],
        "translations": {
            "kn": {
                "name": "ಸೃಜನಾತ್ಮಕ ಉಡುಗೆ ತಯಾರಿಕೆ ಮತ್ತು ಕಸೂತಿ",
                "description": "ಸುಧಾರಿತ ಮದುವೆಯ ಉಡುಗೆ ತಯಾರಿಕೆ, ಜರ್ದೋಸಿ ಹೊಲಿಗೆಗಳು, ವಧುವಿನ ಹ್ಯಾಂಡ್ ಎಂಬ್ರಾಯ್ಡರಿ ಮತ್ತು ಬೊಟಿಕ್ ವಿನ್ಯಾಸಗಳು."
            },
            "hi": {
                "name": "रचनात्मक पोशाक निर्माण और कढ़ाई",
                "description": "उन्नत शादी के परिधान बनाना, जरदोजी सिलाई, ब्राइडल हैंड कढ़ाई पैटर्न, मनके लगाना और कस्टम बुटीक निर्माण।"
            }
        },
        "is_active": True
    },

    # Digital Skills
    {
        "id": "computer-literacy",
        "category_id": "digital-skills",
        "name": "Basic Computer Literacy",
        "description": "Learn operating systems, keyboard shortcuts, simple word processing, internet searching, and working with digital folders.",
        "difficulty": "Beginner",
        "estimated_duration": "4 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Data Entry Operator", "Office Assistant", "Help Desk Clerk"],
        "translations": {
            "kn": {
                "name": "ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಸಾಕ್ಷರತೆ",
                "description": "ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್‌ಗಳು, ಕೀಬೋರ್ಡ್ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು, ವರ್ಡ್ ಪ್ರೊಸೆಸಿಂಗ್ ಮತ್ತು ಇಂಟರ್ನೆಟ್ ಹುಡುಕಾಟವನ್ನು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "बुनियादी कंप्यूटर साक्षरता",
                "description": "ऑपरेटिंग सिस्टम, कीबोर्ड शॉर्टकट, वर्ड प्रोसेसिंग, इंटरनेट सर्चिंग और डिजिटल फ़ोल्डर बनाना सीखें।"
            }
        },
        "is_active": True
    },
    {
        "id": "digital-payments",
        "category_id": "digital-skills",
        "name": "Mobile Banking & Digital Payments",
        "description": "Secure smartphone operations, setting up UPI accounts (BHIM, Google Pay, PhonePe), verifying transaction receipts, and avoiding scams.",
        "difficulty": "Beginner",
        "estimated_duration": "2 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Digital Commerce Assistant", "Smart Shop Owner", "Peer Digital Advocate"],
        "translations": {
            "kn": {
                "name": "ಮೊಬೈಲ್ ಬ್ಯಾಂಕಿಂಗ್ ಮತ್ತು ಡಿಜಿಟಲ್ ಪಾವತಿಗಳು",
                "description": "ಯುಪಿಐ ಖಾತೆಗಳನ್ನು ಹೊಂದಿಸುವುದು, ಪಾವತಿ ರಶೀದಿಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದು ಮತ್ತು ಆನ್‌ಲೈನ್ ಹಗರಣಗಳಿಂದ ರಕ್ಷಣೆ ಪಡೆಯುವುದು."
            },
            "hi": {
                "name": "मोबाइल बैंकिंग और डिजिटल भुगतान",
                "description": "स्मार्टफोन का सुरक्षित संचालन, यूपीआई खाते स्थापित करना, लेनदेन की रसीदों का सत्यापन और घोटालों से बचना।"
            }
        },
        "is_active": True
    },
    {
        "id": "digital-marketing",
        "category_id": "digital-skills",
        "name": "Digital Marketing & Social Media",
        "description": "Learn social media management, brand creation, content marketing on Instagram/WhatsApp Business, and listing products on Google Maps.",
        "difficulty": "Intermediate",
        "estimated_duration": "6 Weeks",
        "prerequisites": ["Basic Computer Literacy"],
        "career_options": ["Social Media Manager", "Brand Executive", "E-commerce Support Associate"],
        "translations": {
            "kn": {
                "name": "ಡಿಜಿಟಲ್ ಮಾರ್ಕೆಟಿಂಗ್ ಮತ್ತು ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ",
                "description": "ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ನಿರ್ವಹಣೆ, ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಬಿಸಿನೆಸ್‌ನಲ್ಲಿ ಬ್ರ್ಯಾಂಡ್ ರಚನೆ ಮತ್ತು ಜಾಹೀರಾತು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "डिजिटल मार्केटिंग और सोशल मीडिया",
                "description": "सोशल मीडिया प्रबंधन, ब्रांड निर्माण, इंस्टाग्राम/व्हाट्सएप बिजनेस पर सामग्री विपणन और उत्पाद लिस्टिंग सीखें।"
            }
        },
        "is_active": True
    },

    # Entrepreneurship
    {
        "id": "micro-bookkeeping",
        "category_id": "entrepreneurship",
        "name": "Micro-Enterprise Bookkeeping",
        "description": "Track cash flow, compile basic profit-and-loss statements, manage invoice registers, and separate personal expenses from business finance.",
        "difficulty": "Beginner",
        "estimated_duration": "4 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Small Business Accountant", "Finance Coordinator", "Self-Employed Retailer"],
        "translations": {
            "kn": {
                "name": "ಮೈಕ್ರೋ-ಎಂಟರ್‌ಪ್ರೈಸ್ ಬುಕ್ಕೀಪಿಂಗ್",
                "description": "ನಗದು ಹರಿವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು, ಮೂಲ ಲಾಭ ಮತ್ತು ನಷ್ಟ ಹೇಳಿಕೆಗಳನ್ನು ಕಂಪೈಲ್ ಮಾಡುವುದು ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್‌ ನಿರ್ವಹಿಸುವುದು."
            },
            "hi": {
                "name": "सूक्ष्म-उद्यम बहीखाता (बुककीपिंग)",
                "description": "नकद प्रवाह को ट्रैक करना, बुनियादी लाभ-हानि विवरण संकलित करना, चालान रजिस्टर प्रबंधित करना।"
            }
        },
        "is_active": True
    },
    {
        "id": "online-shop-setup",
        "category_id": "entrepreneurship",
        "name": "E-commerce & Online Shop Setup",
        "description": "Build products catalogs on Shopify or ONDC network, configure secure payment checkouts, list on digital directories, and arrange shipping.",
        "difficulty": "Intermediate",
        "estimated_duration": "6 Weeks",
        "prerequisites": ["Basic Computer Literacy", "Micro-Enterprise Bookkeeping"],
        "career_options": ["Online Shop Manager", "Dropshipping Entrepreneur", "Digital Sales Planner"],
        "translations": {
            "kn": {
                "name": "ಇ-ಕಾಮರ್ಸ್ ಮತ್ತು ಆನ್‌ಲೈನ್ ಶಾಪ್ ಸೆಟಪ್",
                "description": "ಶಾಪಿಫೈ ಅಥವಾ ಒಎನ್‌ಡಿಸಿಯಲ್ಲಿ ಉತ್ಪನ್ನ ಕ್ಯಾಟಲಾಗ್ ರಚಿಸುವುದು, ಸುರಕ್ಷಿತ ಪಾವತಿ ಮತ್ತು ಶಿಪ್ಪಿಂಗ್ ವ್ಯವಸ್ಥೆ ಮಾಡುವುದು."
            },
            "hi": {
                "name": "ई-कॉमर्स और ऑनलाइन शॉप सेटअप",
                "description": "शॉपिफाई या ओएनडीसी नेटवर्क पर उत्पाद कैटलॉग बनाना, सुरक्षित भुगतान चेकआउट कॉन्फ़िगर करना और शिपिंग व्यवस्था।"
            }
        },
        "is_active": True
    },

    # Handicrafts
    {
        "id": "embroidery-crochet",
        "category_id": "handicrafts",
        "name": "Hand Embroidery & Crochet",
        "description": "Basic needle stitches, chain stitch patterns, woolen crochet hooks, and creating handmade lace or warm winter accessories.",
        "difficulty": "Beginner",
        "estimated_duration": "4 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Crochet Decorator", "Embroidery Crafts Worker", "Home Goods Retailer"],
        "translations": {
            "kn": {
                "name": "ಹ್ಯಾಂಡ್ ಎಂಬ್ರಾಯ್ಡರಿ ಮತ್ತು ಕ್ರೋಚೆಟ್",
                "description": "ಮೂಲ ಸೂಜಿ ಹೊಲಿಗೆಗಳು, ಸರಪಳಿ ಹೊಲಿಗೆ ಮಾದರಿಗಳು ಮತ್ತು ಕೈಯಿಂದ ಮಾಡಿದ ಲೇಸ್ ಅಥವಾ ಚಳಿಗಾಲದ ಪರಿಕರಗಳ ತಯಾರಿಕೆ."
            },
            "hi": {
                "name": "हाथ की कढ़ाई और क्रोशिया",
                "description": "बुनियादी सुई सिलाई, चेन स्टिच पैटर्न, ऊनी क्रोशिया हुक और हस्तनिर्मित लेस या सामान बनाना।"
            }
        },
        "is_active": True
    },

    # Food & Catering
    {
        "id": "baking-confectionery",
        "category_id": "food-catering",
        "name": "Baking & Confectionery",
        "description": "Oven mechanics, weighing scales, recipes for basic tea cakes, breads, icing techniques, and packaging standards.",
        "difficulty": "Beginner",
        "estimated_duration": "6 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Bakery Chef", "Home Baker", "Cafe Supplier"],
        "translations": {
            "kn": {
                "name": "ಬೇಕಿಂಗ್ ಮತ್ತು ಮಿಠಾಯಿ",
                "description": "ಓವನ್ ಕಾರ್ಯಾಚರಣೆ, ಚಹಾ ಕೇಕ್‌ಗಳು ಮತ್ತು ಬ್ರೆಡ್ ತಯಾರಿಕೆ, ಪ್ಯಾಕೇಜಿಂಗ್ ಗುಣಮಟ್ಟವನ್ನು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "बेकिंग और कन्फेक्शनरी",
                "description": "ओवन यांत्रिकी, वजन तराजू, बुनियादी चाय केक, ब्रेड, आइसिंग तकनीक और पैकेजिंग मानक।"
            }
        },
        "is_active": True
    },

    # Agriculture
    {
        "id": "organic-farming",
        "category_id": "agriculture",
        "name": "Organic Farming & Composting",
        "description": "Natural vermicomposting, soil enrichment techniques, organic pesticide sprays (Panchagavya), and crop rotation calendars.",
        "difficulty": "Beginner",
        "estimated_duration": "6 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Organic Produce Vendor", "Farm Consultant", "Bio-Fertilizer Supplier"],
        "translations": {
            "kn": {
                "name": "ಸಾವಯವ ಕೃಷಿ ಮತ್ತು ಗೊಬ್ಬರ",
                "description": "ನೈಸರ್ಗಿಕ ಎರೆಗೊಬ್ಬರ ತಯಾರಿಕೆ, ಮಣ್ಣು ಫಲವತ್ತತೆ ತಂತ್ರಗಳು ಮತ್ತು ಸಾವಯವ ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ."
            },
            "hi": {
                "name": "जैविक खेती और खाद बनाना",
                "description": "प्राकृतिक केंचुआ खाद, मिट्टी संवर्धन तकनीक, जैविक कीटनाशक स्प्रे (पंचगव्य) और फसल चक्र।"
            }
        },
        "is_active": True
    },

    # Healthcare & Caregiving
    {
        "id": "elder-care",
        "category_id": "healthcare-caregiving",
        "name": "Elder Care & First Aid",
        "description": "Elder nursing basics, vital signs checking (BP, blood sugar), professional home assistance, and critical first aid maneuvers.",
        "difficulty": "Beginner",
        "estimated_duration": "8 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Home Care Assistant", "Senior Nursing Associate", "First Aid Coordinator"],
        "translations": {
            "kn": {
                "name": "ವೃದ್ಧರ ಆರೈಕೆ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
                "description": "ವೃದ್ಧರ ಮೂಲ ಆರೈಕೆ, ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸಕ್ಕರೆ ಪರೀಕ್ಷೆ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ತರಬೇತಿ."
            },
            "hi": {
                "name": "बुजुर्गों की देखभाल और प्राथमिक चिकित्सा",
                "description": "बुजुर्गों की देखभाल की बुनियादी बातें, महत्वपूर्ण संकेत जांच (बीपी, रक्त शर्करा), और प्राथमिक चिकित्सा।"
            }
        },
        "is_active": True
    },
    # Beauty & Wellness
    {
        "id": "beauty-personal-care",
        "category_id": "beauty-wellness",
        "name": "Beauty and Personal Care",
        "description": "Learn basic beauty and personal-care skills including skincare, hair care, hygiene, basic makeup, and salon service fundamentals.",
        "difficulty": "Beginner",
        "estimated_duration": "4 Weeks",
        "prerequisites": ["None"],
        "career_options": ["Beautician", "Salon Assistant", "Freelance Makeup Artist"],
        "translations": {
            "kn": {
                "name": "ಸೌಂದರ್ಯ ಮತ್ತು ವೈಯಕ್ತಿಕ ಆರೈಕೆ",
                "description": "ತ್ವಚೆಯ ಆರೈಕೆ, ಕೂದಲಿನ ಆರೈಕೆ, ನೈರ್ಮಲ್ಯ ಮತ್ತು ಮೂಲ ಮೇಕಪ್ ಸೇರಿದಂತೆ ಸೌಂದರ್ಯ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ."
            },
            "hi": {
                "name": "सौंदर्य और व्यक्तिगत देखभाल",
                "description": "त्वचा की देखभाल, बालों की देखभाल, स्वच्छता और बुनियादी मेकअप सहित सौंदर्य कौशल सीखें।"
            }
        },
        "is_active": True
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

class SkillService:
    @classmethod
    def initialize_database(cls):
        """
        Seeds initial Categories and Skills if empty or missing.
        """
        db = db_instance.get_db()
        if db is not None:
            # Seed Categories if empty
            if db["categories"].count_documents({}) == 0:
                cats_to_insert = []
                for cat in INITIAL_CATEGORIES:
                    cat_copy = dict(cat)
                    cat_copy["created_at"] = datetime.utcnow()
                    cats_to_insert.append(cat_copy)
                db["categories"].insert_many(cats_to_insert)

            # Seed Skills if empty
            if db["skills"].count_documents({}) == 0:
                skills_to_insert = []
                for sk in INITIAL_SKILLS:
                    sk_copy = dict(sk)
                    sk_copy["created_at"] = datetime.utcnow()
                    skills_to_insert.append(sk_copy)
                db["skills"].insert_many(skills_to_insert)
        else:
            # Use local JSON fallback files
            cats = load_mock_data(MOCK_CATEGORIES_FILE)
            if not cats:
                cats = []
                for cat in INITIAL_CATEGORIES:
                    cat_copy = dict(cat)
                    cat_copy["created_at"] = datetime.utcnow().isoformat()
                    cats.append(cat_copy)
                save_mock_data(MOCK_CATEGORIES_FILE, cats)

            skills = load_mock_data(MOCK_SKILLS_FILE)
            if not skills:
                skills = []
                for sk in INITIAL_SKILLS:
                    sk_copy = dict(sk)
                    sk_copy["created_at"] = datetime.utcnow().isoformat()
                    skills.append(sk_copy)
                save_mock_data(MOCK_SKILLS_FILE, skills)

    @classmethod
    def get_categories(cls, lang: Optional[str] = "en") -> List[Dict[str, Any]]:
        """
        Retrieves all active categories, with preferred language translations applied as fallback overrides.
        """
        cls.initialize_database()
        db = db_instance.get_db()
        categories = []

        if db is not None:
            db_cats = list(db["categories"].find({"is_active": True}))
            for cat in db_cats:
                cat["id"] = str(cat.get("id") or cat.get("_id"))
                if "_id" in cat:
                    del cat["_id"]
                if "created_at" in cat and isinstance(cat["created_at"], datetime):
                    cat["created_at"] = cat["created_at"].isoformat()
                categories.append(cat)
        else:
            categories = load_mock_data(MOCK_CATEGORIES_FILE)

        # Apply translations if preferred language is not English
        return [cls._apply_category_translation(cat, lang) for cat in categories if cat.get("is_active", True)]

    @classmethod
    def get_category_by_id(cls, category_id: str, lang: Optional[str] = "en") -> Optional[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        cat = None

        if db is not None:
            cat = db["categories"].find_one({"id": category_id, "is_active": True})
            if cat:
                cat["id"] = str(cat.get("id") or cat.get("_id"))
                if "_id" in cat:
                    del cat["_id"]
                if "created_at" in cat and isinstance(cat["created_at"], datetime):
                    cat["created_at"] = cat["created_at"].isoformat()
        else:
            cats = load_mock_data(MOCK_CATEGORIES_FILE)
            for c in cats:
                if c.get("id") == category_id and c.get("is_active", True):
                    cat = c
                    break

        if cat:
            return cls._apply_category_translation(cat, lang)
        return None

    @classmethod
    def get_skills(cls, category_id: Optional[str] = None, difficulty: Optional[str] = None, search_query: Optional[str] = None, lang: Optional[str] = "en") -> List[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        skills = []

        if db is not None:
            query = {"is_active": True}
            if category_id:
                query["category_id"] = category_id
            if difficulty:
                import re
                safe_difficulty = re.escape(str(difficulty).strip())
                # Case-insensitive match or standard matching
                query["difficulty"] = {"$regex": f"^{safe_difficulty}$", "$options": "i"}
            
            db_skills = list(db["skills"].find(query))
            for sk in db_skills:
                sk["id"] = str(sk.get("id") or sk.get("_id"))
                if "_id" in sk:
                    del sk["_id"]
                if "created_at" in sk and isinstance(sk["created_at"], datetime):
                    sk["created_at"] = sk["created_at"].isoformat()
                skills.append(sk)
        else:
            all_skills = load_mock_data(MOCK_SKILLS_FILE)
            for sk in all_skills:
                if not sk.get("is_active", True):
                    continue
                if category_id and sk.get("category_id") != category_id:
                    continue
                if difficulty and sk.get("difficulty", "").lower() != difficulty.lower():
                    continue
                skills.append(sk)

        # Apply translations and standard filters
        processed_skills = [cls._apply_skill_translation(sk, lang) for sk in skills]

        # Backend search implementation if a search query is present
        if search_query:
            sq = search_query.strip().lower()
            filtered_skills = []
            for sk in processed_skills:
                # Search across translated/current name, description, category_id, or career options
                name_match = sq in sk.get("name", "").lower()
                desc_match = sq in sk.get("description", "").lower()
                cat_match = sq in sk.get("category_id", "").lower()
                career_match = any(sq in option.lower() for option in sk.get("career_options", []))
                
                if name_match or desc_match or cat_match or career_match:
                    filtered_skills.append(sk)
            return filtered_skills

        return processed_skills

    @classmethod
    def get_skill_by_id(cls, skill_id: str, lang: Optional[str] = "en") -> Optional[Dict[str, Any]]:
        cls.initialize_database()
        db = db_instance.get_db()
        sk = None

        if db is not None:
            sk = db["skills"].find_one({"id": skill_id, "is_active": True})
            if sk:
                sk["id"] = str(sk.get("id") or sk.get("_id"))
                if "_id" in sk:
                    del sk["_id"]
                if "created_at" in sk and isinstance(sk["created_at"], datetime):
                    sk["created_at"] = sk["created_at"].isoformat()
        else:
            skills = load_mock_data(MOCK_SKILLS_FILE)
            for s in skills:
                if s.get("id") == skill_id and s.get("is_active", True):
                    sk = s
                    break

        if sk:
            return cls._apply_skill_translation(sk, lang)
        return None

    @classmethod
    def get_rule_based_recommendations(cls, profile: Dict[str, Any], lang: Optional[str] = "en") -> List[Dict[str, Any]]:
        """
        Calculates preliminary personalized rule-based recommendations matching
        learner's existing interests, desired skills, or career goal.
        """
        all_skills = cls.get_skills(lang=lang)
        recommended = []

        interests = [i.strip().lower() for i in profile.get("learning_interests" or [], [])]
        existing = [e.strip().lower() for e in profile.get("existing_skills" or [], [])]
        career_goal = (profile.get("career_goal") or "").lower()

        # Let's map certain profile parameters to specific skill tags
        # Example: Interest: "Digital marketing" -> match E-commerce, Digital payments, Basic computer literacy
        # Interest: "Tailoring" -> match Stitching and Wedding embroidery
        for sk in all_skills:
            score = 0
            sk_name = sk.get("name", "").lower()
            sk_desc = sk.get("description", "").lower()
            sk_cat = sk.get("category_id", "").lower()

            # 1. Check direct name matches or substring matches with interests
            for interest in interests:
                if interest in sk_name or interest in sk_desc or interest in sk_cat:
                    score += 3

            # 2. Check career goal matching (e.g. Entrepreneurship matches boutique tailoring, e-commerce, bookkeeping)
            if "entrepreneur" in career_goal:
                if sk_cat in ["entrepreneurship", "tailoring-fashion", "beauty-wellness", "food-catering"]:
                    score += 2
            elif "freelance" in career_goal:
                if sk_cat in ["tailoring-fashion", "handicrafts", "beauty-wellness", "digital-skills"]:
                    score += 2
            elif "employment" in career_goal:
                if sk_cat in ["digital-skills", "healthcare-caregiving", "food-catering"]:
                    score += 2

            # 3. Exclude skills the learner already claims to possess to promote new learning pathways
            # (unless they want to "Improve existing skills" in their career goal)
            if "improve" not in career_goal:
                for exist in existing:
                    if exist in sk_name or exist in sk_desc:
                        score -= 5

            if score > 0:
                recommended.append((sk, score))

        # Sort by recommendation score descending
        recommended.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in recommended[:3]]

    @classmethod
    def get_personalized_recommendations(cls, profile: Dict[str, Any], lang: Optional[str] = "en") -> List[Dict[str, Any]]:
        """
        AI-based personalized skill recommendations.
        Attempts to use Gemini to analyze interests, goals, active enrollments, and progress,
        and matches them against the NariNexus skill catalog to recommend 3 personalized skills.
        If Gemini is rate limited (429) or fails, falls back gracefully to rule-based recommendations.
        """
        user_id = profile.get("id") or profile.get("user_id")
        user_name = profile.get("name") or "Learner"
        interests = profile.get("learning_interests", [])
        existing_skills = profile.get("existing_skills", [])
        experience_level = profile.get("experience_level") or profile.get("skill_level") or "Beginner"
        career_goal = profile.get("career_goal") or ""
        active_lang = lang or profile.get("preferred_language") or "en"

        enroll_str = ""
        if user_id:
            try:
                from backend.app.services.enrollment_service import EnrollmentService
                from backend.app.services.progress_service import ProgressService
                enrollments = EnrollmentService.get_learner_enrollments(user_id)
                if enrollments:
                    for e in enrollments:
                        course_id = e.get("course_id")
                        prog = ProgressService.get_course_progress(user_id, course_id)
                        percent = prog.get("progress_percentage", 0)
                        enroll_str += f"- Enrolled in: {e.get('course_title')} (ID: {course_id}), Progress: {percent}%, Status: {e.get('status')}\n"
                else:
                    enroll_str = "- Not enrolled in any courses yet.\n"
            except Exception as e_err:
                enroll_str = f"Error loading enrollment context: {str(e_err)}\n"

        all_skills = cls.get_skills(lang=active_lang)
        skills_pool = []
        for sk in all_skills:
            skills_pool.append({
                "id": sk.get("id"),
                "name": sk.get("name"),
                "description": sk.get("description"),
                "category_id": sk.get("category_id"),
                "difficulty": sk.get("difficulty"),
                "estimated_duration": sk.get("estimated_duration"),
                "career_options": sk.get("career_options", [])
            })

        try:
            from backend.app.services.ai_service import AIService
            from google.genai import types
            client = AIService.get_client()
            if client:
                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                ai_response_text = None

                system_instruction = (
                    "You are NariNexus Personalized Skill Recommendation Engine, an intelligent matching system for rural women.\n"
                    "You analyze the learner's profile data and recommend exactly 3 skills from the available Skills Pool.\n"
                    "Your response must be a valid raw JSON array containing exactly 3 objects. Do not include any extra text."
                )

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                    response_mime_type="application/json"
                )

                prompt = (
                    f"Return exactly 3 personalized skill recommendations as a JSON array of objects matching the specified schema.\n"
                    f"Learner Profile:\n"
                    f"- Name: {user_name}\n"
                    f"- Preferred Language: {active_lang}\n"
                    f"- Interests: {interests}\n"
                    f"- Existing Skills: {existing_skills}\n"
                    f"- Skill Level: {experience_level}\n"
                    f"- Goals/Career: {career_goal}\n"
                    f"- Enrollments Progress:\n{enroll_str}\n\n"
                    f"Skills Pool:\n{json.dumps(skills_pool)}\n\n"
                    f"JSON schema to return:\n"
                    f"[\n"
                    f"  {{\n"
                    f"    \"id\": \"skill-id\",\n"
                    f"    \"reason\": \"Why recommended in language: {active_lang}\",\n"
                    f"    \"benefit\": \"Benefit in language: {active_lang}\",\n"
                    f"    \"next_step\": \"Suggested next action in language: {active_lang}\"\n"
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
                            continue
                        else:
                            continue

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
                            {"recommended_skills": rec_list},
                            "skill_recommendation"
                        )
                        rec_list = validated_res.get("recommended_skills", [])

                        final_recommendations = []
                        for r in rec_list:
                            skill_id = r.get("id")
                            skill_obj = cls.get_skill_by_id(skill_id, lang=active_lang)
                            if skill_obj:
                                skill_obj["reason"] = r.get("reason") or f"This is highly recommended for {experience_level} learners."
                                skill_obj["benefit"] = r.get("benefit") or "Helps you master practical local livelihood and digital skills."
                                skill_obj["next_step"] = r.get("next_step") or "Explore the detailed modules for this skill."
                                final_recommendations.append(skill_obj)
                        if final_recommendations:
                            return final_recommendations[:3]
        except Exception:
            pass

        # Rule-based fallback
        rule_recs = cls.get_rule_based_recommendations(profile, lang=active_lang)
        final_fallback = []
        for sk in rule_recs:
            sk_name = sk.get("name")
            if active_lang == "kn":
                sk["reason"] = f"ನಿಮ್ಮ ಆಸಕ್ತಿಗಳು ಮತ್ತು ಪ್ರೊಫೈಲ್ ಆಧರಿಸಿ ಈ {sk_name} ಕೌಶಲ್ಯವನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ."
                sk["benefit"] = "ಇದು ಸ್ಥಳೀಯ ಉದ್ಯೋಗಾವಕಾಶಗಳು ಅಥವಾ ಸಣ್ಣ ಉದ್ಯಮವನ್ನು ಪ್ರಾರಂಭಿಸಲು ನಿಮಗೆ ಸಹಕಾರಿಯಾಗಿದೆ."
                sk["next_step"] = "ಕೋರ್ಸ್ ವಿವರಗಳನ್ನು ಅನ್ವೇಷಿಸಲು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ."
            elif active_lang == "hi":
                sk["reason"] = f"आपकी रुचियों और प्रोफ़ाइल के आधार पर इस {sk_name} कौशल की सिफारिश की गई है।"
                sk["benefit"] = "यह स्थानीय रोजगार के अवसरों या छोटे पैमाने पर व्यवसाय शुरू करने में आपकी सहायता करेगा।"
                sk["next_step"] = "कोर्स के विवरण देखने के लिए क्लिक करें।"
            else:
                sk["reason"] = f"Recommended based on your alignment with {sk_name} and your current learning goals."
                sk["benefit"] = "This helps in establishing local self-employment or unlocking small business streams."
                sk["next_step"] = f"View course options and lessons for {sk_name} to get started."
            final_fallback.append(sk)
        return final_fallback[:3]

    @staticmethod
    def _apply_category_translation(cat: Dict[str, Any], lang: Optional[str]) -> Dict[str, Any]:
        if not lang or lang == "en":
            return cat
        
        translations = cat.get("translations", {})
        if lang in translations:
            lang_data = translations[lang]
            translated_cat = dict(cat)
            for k, v in lang_data.items():
                translated_cat[k] = v
            return translated_cat
        return cat

    @staticmethod
    def _apply_skill_translation(sk: Dict[str, Any], lang: Optional[str]) -> Dict[str, Any]:
        if not lang or lang == "en":
            return sk
        
        translations = sk.get("translations", {})
        if lang in translations:
            lang_data = translations[lang]
            translated_sk = dict(sk)
            for k, v in lang_data.items():
                translated_sk[k] = v
            return translated_sk
        return sk
