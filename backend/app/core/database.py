from pymongo import MongoClient
import logging
from backend.app.core.config import settings

logger = logging.getLogger("narinexus")

class Database:
    client: MongoClient = None
    db = None

    @classmethod
    def connect(cls) -> bool:
        if not settings.MONGODB_URI:
            logger.info("MONGODB_URI environment variable is not defined or is empty. Activating JSON/mock local database fallback...")
            cls.client = None
            cls.db = None
            return True
        try:
            logger.info("Connecting to MongoDB Atlas...")
            # Set a 5-second server selection timeout to avoid hanging the backend on startup
            cls.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            # The ping command is cheap and checks if we can actually reach the database server
            cls.client.admin.command('ping')
            cls.db = cls.client[settings.DATABASE_NAME]
            logger.info(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")
            return True
        except Exception as e:
            logger.warning(f"Failed to establish MongoDB Atlas connection: {str(e)}. Falling back to local JSON/mock database...")
            cls.client = None
            cls.db = None
            return True

    @classmethod
    def disconnect(cls):
        if cls.client:
            cls.client.close()
            logger.info("Closed MongoDB database connection.")

    @classmethod
    def is_connected(cls) -> bool:
        if cls.client is None or cls.db is None:
            return False
        try:
            cls.client.admin.command('ping')
            return True
        except Exception:
            return False

    @classmethod
    def is_fallback(cls) -> bool:
        return cls.client is None or cls.db is None

    @classmethod
    def get_db(cls):
        return cls.db

db_instance = Database()
