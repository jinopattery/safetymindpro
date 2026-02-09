# SafetyMindPro Architecture

SafetyMindPro is a universal graph-based safety analysis & anomaly detection platform supporting automotive FMEA/FTA workflows.

## Architecture Diagram

```mermaid
flowchart TD
    U[User Browser] --> F[Frontend: React.js]
    F -- REST API --> B[Backend: FastAPI (Python)]
    B -- ORM --> D[(SQLite DB)]
    F -- File Upload/Export --> B
```

---

## Overview

- **Frontend:** React Single Page App (SPA) using JavaScript/CSS/HTML
- **Backend:** FastAPI (Python); REST API, safety logic, file import/export, analytics
- **Database:** SQLite (can be switched to another SQL DB)
- **Communication:** HTTP/REST between frontend & backend

## Component Details

**Frontend:**  
- React.js, fetches/sends data to FastAPI backend  
- UI: Dashboard, FMEA, FTA, Risk Matrix, Reports

**Backend:**  
- FastAPI, SQLAlchemy ORM  
- Routers for FMEA, FTA, Upload, Export  
- Data processing, risk calculations, imports/exports

**Database:**  
- SQLite, stores all safety analyses

---

> For architecture edits, open a PR or discuss with repo maintainers.