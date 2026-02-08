from backend.routers import fmea, fta, upload, export, diagrams

app.include_router(diagrams.router)