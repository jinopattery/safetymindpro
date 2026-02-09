"""
SafetyMindPro FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import fmea, fta, upload, export, diagrams

# Initialize database
init_db()

app = FastAPI(
    title="SafetyMindPro",
    description="Safety Analysis Platform with FMEA/FTA Support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(fmea.router)
app.include_router(fta.router)
app.include_router(upload.router)
app.include_router(export.router)
app.include_router(diagrams.router)

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "SafetyMindPro API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "fmea": "/api/v1/fmea/analyses",
            "fta": "/api/v1/fta/trees",
            "upload": "/api/v1/upload",
            "export": "/api/v1/fmea/analyses/{id}/export",
            "diagrams": "/api/v1/diagrams"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)