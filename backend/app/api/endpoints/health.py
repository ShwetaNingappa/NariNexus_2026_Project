from fastapi import APIRouter
from backend.app.core.database import db_instance

router = APIRouter()

@router.get("/health")
def health_check():
    connected = db_instance.is_connected()
    return {
        "success": True,
        "message": "NariNexus API is running",
        "database": "connected" if connected else "failed"
    }
