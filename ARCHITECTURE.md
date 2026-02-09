# SafetyMindPro Architecture

SafetyMindPro is a universal graph-based safety analysis & anomaly detection platform supporting automotive FMEA/FTA workflows. This document describes the system architecture at a high level.

## Overview

- **Frontend:** JavaScript React SPA (dashboard, FMEA, FTA, risk matrix, export)
- **Backend:** Python FastAPI (REST API, analysis, file ops)
- **Database:** SQLite (stores all analysis/risk data, users)
- **Communication:** REST/HTTP between frontend and backend

## Architecture Diagram

```mermaid
flowchart TD
    U[Users' Browsers] --> F[Frontend\nReact.js\nJavaScript/CSS/HTML]
    F -->|REST API (HTTP)| B[Backend\nFastAPI (Python)]
    B -->|ORM| D[(SQLite DB)]
    B <-->|File Upload| F
    B -->|Export (Excel/CSV)| F
```


## Component Details

### Frontend (React.js)
- Establishes HTTP(S) connection to backend FastAPI endpoints
- Dashboard visualizes risk/analysis (charts, tables)
- Allows creation/upload/export of FMEA, FTA analyses
- Styling handled with CSS; HTML scaffolding via React components

### Backend (FastAPI)
- Multiple routers: FMEA, FTA, file upload/export, etc.
- Implements logic for risk calculations, graph ops, anomaly detection
- Handles all file I/O (Excel/CSV imports/exports)
- ORM (SQLAlchemy) and Pydantic schemas
- API docs live at `/docs`

### Database (SQLite)
- Data for all analyses, risk matrices, and users
- Designed for quick prototyping (can swap for e.g., PostgreSQL)

## Data Flow Example

1. **User**: Logs in / opens dashboard in browser (SPA loads)
2. **Frontend (React)**: Makes `GET /api/v1/fmea` request
3. **Backend (FastAPI)**: Queries SQLite for FMEA records, returns JSON
4. **Frontend**: Renders records, allows CRUD/edit/upload/export
5. **Export**: Request sent, backend generates (Excel/CSV), response downloaded by frontend

## Future/Extensibility Notes
- Database can be upgraded (e.g., to PostgreSQL)
- Containerization possible for deployment
- Can add external integrations for real-time sync or reporting

---

> For internal architectural changes, see docs/architecture or open a PR discussion.
