from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import fmea, fta, upload, export, diagrams

# Initialize the database
init_db()

# Create FastAPI app
app = FastAPI(
    title="SafetyMindPro",
    description="Safety Analysis Platform with FMEA/FTA Support",
    version="1.0.0",
)

# Add CORS middleware
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
    return {
        "message": "Welcome to SafetyMindPro!",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": ["/health", "/fmea", "/fta", "/upload", "/export", "/diagrams"]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)