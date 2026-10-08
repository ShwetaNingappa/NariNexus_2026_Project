import logging
import warnings
# Silence pydantic field shadowing user warnings from third-party Google/API dependencies
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Apply global exceptiongroup monkeypatch to traceback module for native Python 3.10 support on import
try:
    import exceptiongroup
except ImportError:
    pass

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



# Conditional CORS Configuration (Production Hardened, Development Flexible)
if settings.ENVIRONMENT == "production":
    if settings.CORS_ORIGINS:
        allow_origins = [orig.strip() for orig in settings.CORS_ORIGINS.split(",") if orig.strip()]
    else:
        allow_origins = [
            "https://narinexus.org",
            "https://www.narinexus.org",
            "https://narinexus.com"
        ]
    allow_credentials = True
else:
    allow_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lightweight HTTP Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Request Body Size Protection Middleware with Integrated Audit Tracking
@app.middleware("http")
async def limit_content_length(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                max_size = 5 * 1024 * 1024  # 5 MB
                if length > max_size:
                    try:
                        from backend.app.services.audit_service import AuditService
                        AuditService.record_audit_event(
                            actor_user_id="system",
                            actor_role="system",
                            action="OVERSIZED_REQUEST_REJECTED",
                            resource_type="HTTP_API",
                            resource_id="system",
                            success=False,
                            metadata={"content_length": length, "max_allowed": max_size, "path": str(request.url.path)}
                        )
                    except Exception:
                        pass
                    return JSONResponse(
                        status_code=413,
                        content={
                            "success": False,
                            "message": "Request Entity Too Large"
                        }
                    )
            except ValueError:
                pass
    return await call_next(request)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    try:
        import asyncio
        import anyio
        from fastapi import HTTPException
        
        # Safe extraction of any nested concurrency ExceptionGroup exceptions
        def extract_all_sub_exceptions(e: BaseException) -> list:
            subs = []
            if hasattr(e, "exceptions") and e.exceptions:
                subs.extend(list(e.exceptions))
            elif hasattr(e, "_exceptions") and e._exceptions:
                subs.extend(list(e._exceptions))
            return subs

        is_group = "ExceptionGroup" in type(exc).__name__ or hasattr(exc, "exceptions") or hasattr(exc, "_exceptions")
        sub_exceptions = extract_all_sub_exceptions(exc) if is_group else []

        # Check for disconnection
        is_disconnect_or_cancel = False
        exc_name = type(exc).__name__
        if exc_name in ("ClientDisconnected", "CancelledError", "ConnectionResetError", "BrokenPipeError", "OSError"):
            is_disconnect_or_cancel = True
        else:
            try:
                if await request.is_disconnected():
                    is_disconnect_or_cancel = True
            except Exception:
                pass

        if is_disconnect_or_cancel:
            logger.warning(f"Connection closed or cancelled: {str(exc)}")
            return JSONResponse(status_code=499, content={"success": False, "message": "Connection closed"})

        if isinstance(exc, HTTPException):
            return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail})

        # Process first sub-exception if it exists
        if sub_exceptions:
            first_sub = sub_exceptions[0]
            if isinstance(first_sub, HTTPException):
                return JSONResponse(status_code=first_sub.status_code, content={"success": False, "message": first_sub.detail})
            logger.error(f"Global handler caught ExceptionGroup: {str(exc)}")
        else:
            logger.error(f"Global handler caught exception: {str(exc)}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Something went wrong"
            }
        )
    except Exception as e_handler:
        handler_exc_name = type(e_handler).__name__
        if handler_exc_name in ("ClientDisconnected", "CancelledError", "ConnectionResetError", "BrokenPipeError", "OSError"):
            logger.warning(f"Client disconnected during exception response delivery: {str(e_handler)}")
        else:
            logger.error(f"Error in global exception handler: {str(e_handler)}", exc_info=True)
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


