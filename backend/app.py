"""
SafetyMindPro - Main FastAPI Application
Production-Ready with User Management
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from backend.database import engine, Base

# Import only working routers
from backend.routers import domains, auth, diagrams, fmea
from backend.routers.domains import router_v2  # Import v2 router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for FastAPI application startup and shutdown
    """
    # Startup: Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    
    # Log startup information
    logger.info("=" * 70)
    logger.info("SafetyMindPro API Starting...")
    logger.info("=" * 70)
    logger.info("✅ API Documentation: http://127.0.0.1:8000/docs")
    logger.info("✅ Health Check: http://127.0.0.1:8000/health")
    logger.info("✅ Domains API v1: http://127.0.0.1:8000/api/v1/domains/")
    logger.info("✅ Domains API v2 (Universal): http://127.0.0.1:8000/api/v2/domains/")
    logger.info("✅ Diagrams API: http://127.0.0.1:8000/api/v1/diagrams/")
    logger.info("✅ FMEA API: http://127.0.0.1:8000/api/v1/fmea/")
    logger.info("=" * 70)
    
    yield
    
    # Shutdown: cleanup if needed
    logger.info("SafetyMindPro API shutting down...")


# Create FastAPI app with lifespan handler
app = FastAPI(
    title="SafetyMindPro API",
    description="Multi-Domain Graph Analysis Platform with User Management",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(domains.router, tags=["Domains"])
app.include_router(router_v2, tags=["Domains V2 - Universal Architecture"])
app.include_router(diagrams.router, tags=["Diagrams"])
app.include_router(fmea.router, tags=["FMEA"])

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "SafetyMindPro API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "domains_v1": "/api/v1/domains/",
            "domains_v2": "/api/v2/domains/",
            "login": "/api/v1/auth/login",
            "signup": "/api/v1/auth/signup",
            "diagrams": "/api/v1/diagrams/",
            "fmea": "/api/v1/fmea/"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0"
    }

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
