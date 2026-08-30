import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import db_instance
from backend.app.api.router import api_router

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("narinexus")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB on startup
    connected = db_instance.connect()
    if connected:
        logger.info("Database initialized successfully at application startup.")
    else:
        logger.warning("Database initialization failed at startup. App is running, but database-dependent features will fail.")
    yield
    # Disconnect from MongoDB on shutdown
    db_instance.disconnect()
    logger.info("Application shutdown completed.")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Enabled Multilingual Hybrid Skill Development & Women Empowerment Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
# Allow local dev ports, standard Vite ports, and wildcard matching for cloud dev previews
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # In development, support wide origins while maintaining security checks
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for preview sandbox development, can restrict in production env
    allow_credentials=False, # Must be False if origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global handler caught exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Something went wrong"
        }
    )

# Include central API router under '/api' prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "success": True,
        "message": "Welcome to NariNexus API",
        "docs_url": "/docs"
    }
