from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, init_db
import app.models  # Ensures all models are registered with Base.metadata
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables exist and idempotent migrations run
    init_db()
    try:
        from app.seeds.seed_data import seed_database
        seed_database()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Automatic seed on startup notice: %s", e)
    yield
    # Shutdown logic (if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Financial Guidance & Government Scheme Platform for Rural Entrepreneurs - Phase 1 Backend API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else [settings.BACKEND_CORS_ORIGINS],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/health",
    }

# Mount API Routers under /api
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
def health_check():
    """Health check endpoint to verify backend service availability."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
