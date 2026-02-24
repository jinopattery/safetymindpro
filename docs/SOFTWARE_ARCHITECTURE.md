# SafetyMindPro — Software Architecture

> **Copyright © 2024 SafetyMindPro. All Rights Reserved.**  
> This document is confidential and proprietary. See `LICENSE` for usage terms.

---

## Table of Contents

1. [Overview](#1-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Domain Isolation Model](#3-domain-isolation-model)
4. [Backend Architecture](#4-backend-architecture)
   - 4.1 [Technology Stack](#41-technology-stack)
   - 4.2 [Application Entry-Point](#42-application-entry-point)
   - 4.3 [Domain Registry](#43-domain-registry)
   - 4.4 [Domain Adapters (v1)](#44-domain-adapters-v1)
   - 4.5 [Universal Graph & Domain Mappers (v2)](#45-universal-graph--domain-mappers-v2)
   - 4.6 [Algorithms Layer](#46-algorithms-layer)
   - 4.7 [REST API Routers](#47-rest-api-routers)
   - 4.8 [Database & Models](#48-database--models)
   - 4.9 [Configuration & Environment Variables](#49-configuration--environment-variables)
5. [Frontend Architecture](#5-frontend-architecture)
   - 5.1 [Technology Stack](#51-technology-stack)
   - 5.2 [Routing](#52-routing)
   - 5.3 [WorkspacePage & State Management](#53-workspacepage--state-management)
   - 5.4 [GraphEditor & Layer Views](#54-grapheditor--layer-views)
   - 5.5 [Cascaded Tree Map (All-Layers View)](#55-cascaded-tree-map-all-layers-view)
   - 5.6 [API Client](#56-api-client)
6. [Data Flow](#6-data-flow)
7. [Multi-Domain Deployment (White-Label Builds)](#7-multi-domain-deployment-white-label-builds)
8. [Security Considerations](#8-security-considerations)
9. [Directory Structure Reference](#9-directory-structure-reference)
10. [Extension Guide — Adding a New Domain](#10-extension-guide--adding-a-new-domain)

---

## 1. Overview

SafetyMindPro is a **multi-domain graph-analysis platform** targeting safety-critical industries such as automotive, process plant engineering, and finance.

Key design goals:

| Goal | How it is achieved |
|------|--------------------|
| Single source code for multiple industry verticals | Domain-adapter plugin pattern + `ENABLED_DOMAINS` env var |
| Rich graph editing with layered views | React + custom horizontal-tree / cascaded-tree layouts |
| Universal algorithm engine reusable across domains | `UniversalGraph` abstraction + domain mappers |
| Strict per-customer domain isolation | Backend env-var filtering + optional frontend build-time filtering |
| Extensibility without touching core | Register a new `DomainAdapter` and `DomainMapper` — no core changes needed |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                     │
│  ┌────────────┐  ┌──────────────────────────────────────┐   │
│  │  Auth /    │  │  WorkspacePage                       │   │
│  │  Login /   │  │  ├─ DomainSelector (filtered)        │   │
│  │  Signup    │  │  ├─ GraphEditor                      │   │
│  └────────────┘  │  │   ├─ CollapsibleHorizontalTree    │   │
│                  │  │   │   (Form / Function / Failure)  │   │
│                  │  │   └─ CascadedTreeMap (All Layers) │   │
│                  │  └──────────────────────────────────  │   │
│                  └──────────────────────────────────────┘   │
│                              ▲ REST / JSON                   │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                 FastAPI Backend (Python)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  /auth   │  │ /domains │  │ /diagrams│  │  /fmea    │  │
│  │  router  │  │  router  │  │  router  │  │  router   │  │
│  └──────────┘  └────┬─────┘  └──────────┘  └───────────┘  │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │   Domain    │                                │
│              │  Registry   │◄── ENABLED_DOMAINS filter      │
│              └──────┬──────┘                                │
│         ┌───────────┼────────────┐                          │
│         ▼           ▼            ▼                          │
│    Automotive    Finance    ProcessPlant  …more domains     │
│    Adapter       Adapter    Adapter                         │
│         │           │            │                          │
│         └───────────▼────────────┘                          │
│                UniversalGraph + Algorithms                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SQLite / PostgreSQL  (SQLAlchemy + Alembic)        │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Domain Isolation Model

SafetyMindPro is sold as domain-specific products (e.g., *SafetyMindPro Automotive*, *SafetyMindPro Finance*) while sharing a single codebase.  
Domain isolation is enforced at **two independent layers**:

### 3.1 Backend — `ENABLED_DOMAINS` environment variable

Set this variable in the server's `.env` file (or container environment).  
When set, the `/api/v1/domains/*` endpoints only serve the whitelisted domains; all others return HTTP 404.

```
# automotive-only deployment
ENABLED_DOMAINS=automotive

# finance deployment
ENABLED_DOMAINS=finance,financial,trading

# all domains (development default)
ENABLED_DOMAINS=
```

**Affected endpoints:**
- `GET /api/v1/domains/` — list of domain names
- `GET /api/v1/domains/info` — full domain info objects
- `GET /api/v1/domains/{name}/info`
- `GET /api/v1/domains/{name}/styling`
- `GET /api/v1/domains/{name}/algorithms`

### 3.2 Frontend — `REACT_APP_ENABLED_DOMAINS` build-time variable

Optionally set in `frontend/.env` (or CI pipeline) to create a domain-specific React bundle.  
This is a build-time defence-in-depth measure: the backend filter is the authoritative source.

```
# automotive build
REACT_APP_ENABLED_DOMAINS=automotive
```

The domain list returned by the API is intersected with this value inside `WorkspacePage.js` before being shown in the UI.

---

## 4. Backend Architecture

### 4.1 Technology Stack

| Component | Library / Version |
|-----------|------------------|
| Web framework | FastAPI |
| ASGI server | Uvicorn |
| ORM | SQLAlchemy (sync) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
| Config | pydantic-settings |

### 4.2 Application Entry-Point

`backend/app.py` bootstraps the FastAPI application:

1. Configures logging (including passlib/bcrypt noise filter).
2. Creates all database tables via `init_db()` in the `lifespan` hook.
3. Registers CORS middleware.
4. Mounts all routers.

### 4.3 Domain Registry

`backend/domains/registry.py` provides a **singleton** `DomainRegistry` that maintains two in-memory dictionaries:

| Dictionary | Key | Value |
|------------|-----|-------|
| `_domains` | domain name (`str`) | `DomainAdapter` instance |
| `_mappers` | domain name (`str`) | `DomainMapper` instance |

Helper module-level functions (`register_domain`, `register_mapper`, `get_domain`, `get_mapper`, `list_domains`) provide convenient access throughout the codebase.

### 4.4 Domain Adapters (v1)

Located in `backend/domains/<domain_name>/`.  
Each adapter subclasses `backend/domains/base.py::DomainAdapter` and provides:

- `domain_name` / `domain_display_name` / `description`
- `get_node_types()` → list of `NodeType`
- `get_edge_types()` → list of `EdgeType`
- `get_algorithms()` → list of `Algorithm`
- `get_styling_config()` → `StylingConfig`
- `get_schema()` → JSON schema dict
- `validate_node()` / `validate_edge()`
- `enrich_node()`
- `get_export_formats()`

### 4.5 Universal Graph & Domain Mappers (v2)

`backend/core/universal_graph.py` defines a **domain-agnostic** graph representation:

```
UniversalGraph
  ├── form_elements: List[FormElement]   ← physical / logical structure
  ├── functions:     List[Function]      ← behavioural layer
  └── failure_modes: List[FailureMode]   ← risk layer
```

Domain mappers (`backend/core/domain_mapper.py`) implement:
- `map_to_universal_graph(domain_data)` — convert raw domain dict → `UniversalGraph`
- `format_results(results, graph)` — convert algorithm results back to domain format
- `validate_domain_data(data)` → bool

The v2 API (`/api/v2/domains/`) routes requests through mappers to the universal algorithms.

### 4.6 Algorithms Layer

`backend/algorithms/` contains four algorithm modules that operate on `UniversalGraph`:

| Module | Algorithm |
|--------|-----------|
| `structural_analysis.py` | Criticality scores, connectivity, node centrality |
| `functional_analysis.py` | Function-tree traversal, reachability |
| `risk_analysis.py` | Failure propagation, RPN, risk matrix |
| `timeseries_analysis.py` | Time-series anomaly detection |

### 4.7 REST API Routers

| Router | Prefix | Key Responsibilities |
|--------|--------|---------------------|
| `auth.py` | `/api/v1/auth` | Login, signup, JWT issuance, email verification |
| `domains.py` | `/api/v1/domains` (v1) | Domain listing (filtered), styling, algorithm execution |
| `domains.py` | `/api/v2/domains` (v2) | Universal analysis, validation, metadata |
| `diagrams.py` | `/api/v1/diagrams` | Diagram save/load/delete (non-graph-editor diagrams) |
| `fmea.py` | `/api/v1/fmea` | FMEA record management |
| `privacy.py` | `/api/v1/privacy` | GDPR consent, data deletion |

### 4.8 Database & Models

`backend/models.py` defines SQLAlchemy models:
- `User` — authentication + profile
- `Graph` — saved graph data (JSON blob) per user + domain
- `FMEARecord` — FMEA entries

`backend/database.py` provides:
- `engine` — sync SQLAlchemy engine
- `Base` — declarative base
- `get_db()` — FastAPI dependency for session management
- `init_db()` — creates all tables

### 4.9 Configuration & Environment Variables

`backend/config.py` uses `pydantic-settings`. All variables can be set via environment or `.env` file.

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLED_DOMAINS` | `""` (all) | Comma-separated whitelist of domain names |
| `SECRET_KEY` | (dev key) | JWT signing secret — **must change in production** |
| `DATABASE_URL` | SQLite | Database connection string |
| `EMAIL_VERIFICATION_REQUIRED` | `true` | Toggle email verification |
| `SMTP_*` | `""` | SMTP credentials for email sending |
| `APP_BASE_URL` | `http://localhost:3000` | Base URL for email verification links |
| `PRIVACY_POLICY_VERSION` | `"1.0"` | Current privacy policy version |

---

## 5. Frontend Architecture

### 5.1 Technology Stack

| Component | Library / Version |
|-----------|------------------|
| UI framework | React 18 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Graph editing | ReactFlow / @xyflow/react |
| Styling | Plain CSS modules |

### 5.2 Routing

`src/App.js` defines the route tree:

```
/                → redirect to /dashboard or /login
/login           → LoginForm
/signup          → SignupForm
/verify-email    → EmailVerification
/privacy-policy  → PrivacyPolicy
/dashboard       → Dashboard (protected)
/workspace/:domain? → WorkspacePage (protected)
```

### 5.3 WorkspacePage & State Management

`src/components/WorkspacePage.js` is the main application shell.  
State managed locally (React `useState` / `useCallback`):

| State | Purpose |
|-------|---------|
| `selectedDomain` | Currently active domain |
| `domainInfo` | Node types, edge types for selected domain |
| `domainStyling` | Colour/shape theme for selected domain |
| `graph` | `{ nodes, edges }` — current diagram data |
| `activeLayer` | `'form' | 'function' | 'failure' | 'all'` |
| `savedGraphs` | List of user's saved diagrams |
| `currentGraphId` | ID of open saved diagram (null = unsaved) |

Domain list is fetched from `GET /api/v1/domains/info` and optionally filtered by `REACT_APP_ENABLED_DOMAINS`.

### 5.4 GraphEditor & Layer Views

`src/components/GraphEditor.js` renders the diagram canvas.  
The canvas switches between four views depending on `activeLayer`:

| Layer | Component | Notes |
|-------|-----------|-------|
| `form` | `CollapsibleHorizontalTree` | Physical/logical structure tree |
| `function` | `CollapsibleHorizontalTree` | Behavioural tree |
| `failure` | `CollapsibleHorizontalTree` | Risk tree |
| `all` | `CascadedTreeMap` | All layers combined — see §5.5 |

### 5.5 Cascaded Tree Map (All-Layers View)

`CascadedTreeMap` replaces the previous CSS-grid-based `CollapsibleAllLayersGrid`.  
It provides a **horizontal tree layout that grows both vertically and horizontally** as content grows.

**Layout algorithm** (`buildCascadedLayout`):

1. **Height calculation** — each form node box height is computed from its number of attached function and failure chips (variable height).
2. **Post-order traversal** — leaf nodes are placed first, advancing a global `nextY` cursor. Parent nodes are vertically centred on the range spanned by their children's midpoints.
3. **Column assignment** — depth in the form hierarchy maps directly to the horizontal column: `x = depth × (CTM_NODE_W + CTM_COL_GAP)`.
4. **SVG connectors** — Bézier paths connect parent nodes (right edge, mid-height) to child nodes (left edge, mid-height).
5. **Drag-and-drop** — Unallocated function/failure chips in the bottom tray can be dragged onto a form box to create an edge.

Constants (in `GraphEditor.js`):

| Constant | Value | Meaning |
|----------|-------|---------|
| `CTM_NODE_W` | 220 px | Form box width |
| `CTM_HDR_H` | 36 px | Header row height |
| `CTM_CHIP_H` | 26 px | Height per row of chips |
| `CTM_CHIPS_PER_ROW` | 2 | Chips per row inside a node |
| `CTM_COL_GAP` | 72 px | Horizontal gap between depth levels |
| `CTM_ROW_GAP` | 16 px | Vertical gap between sibling subtrees |

### 5.6 API Client

`src/api/domains.js` wraps Axios with typed methods for all domain-related endpoints.  
A global 401 interceptor clears the session and redirects to `/login`.

---

## 6. Data Flow

### Adding a node (frontend → backend → frontend)

```
User types label + clicks "Add"
        │
        ▼
GraphEditor.addNode()
  ├─ Validates input (non-empty, non-duplicate)
  └─ Appends node to local React state (nodes[])
        │  (debounced 300 ms)
        ▼
onGraphChange({ nodes, edges })   ← called by useEffect
        │
        ▼
WorkspacePage receives updated graph
  └─ State updates trigger re-render of sidebar hierarchy tree
        │  (manual "Save" action)
        ▼
domainsAPI.saveGraph() / updateGraph()
  └─ POST /api/v1/domains/save-graph
        │
        ▼
domains router → GraphModel saved in DB
```

### Running an algorithm (frontend → backend → frontend)

```
User selects algorithm + clicks "Run"
        │
        ▼
WorkspacePage.handleRunAlgorithm()
  └─ domainsAPI.runAlgorithm(domain, name, graphData, params)
        │
        ▼
POST /api/v1/domains/run-algorithm
  ├─ Reconstruct Graph from dict
  ├─ Find algorithm in DomainAdapter
  └─ algorithm.run(graph, params) → results
        │
        ▼
Response: { success, results, updated_graph }
        │
        ▼
WorkspacePage: setAlgorithmResults(results)
        │
        ▼
ResultsPanel renders results
```

---

## 7. Multi-Domain Deployment (White-Label Builds)

To ship a domain-specific product from this shared codebase:

### Backend deployment

1. Copy `.env.example` → `.env`.
2. Set `ENABLED_DOMAINS=<your_domains>` (e.g., `ENABLED_DOMAINS=automotive`).
3. The API will only expose automotive endpoints; finance/trading code remains in the
   codebase but is not accessible via any API route.

### Frontend build

1. Create `frontend/.env`:
   ```
   REACT_APP_ENABLED_DOMAINS=automotive
   ```
2. Run `npm run build` — the compiled bundle will only show automotive domains.  
   The finance/trading domain components are still in the bundle (JavaScript is
   not excluded at build time), but the UI will never display or request them.

> **Note:** For maximum isolation (binary-level separation), consider separate
> npm workspaces or tree-shaking with explicit domain feature flags. The current
> model provides functional isolation with a single codebase — the appropriate
> tradeoff for maintainability.

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Authentication | JWT bearer tokens with configurable expiry |
| Password storage | bcrypt hash (via passlib) |
| CORS | Strict origin whitelist (`ALLOWED_ORIGINS`) |
| Domain isolation | Server-side `ENABLED_DOMAINS` filter (authoritative) |
| SQL injection | SQLAlchemy ORM with parameterised queries |
| Sensitive config | Loaded from env vars / `.env` — never committed |
| Email verification | Token-signed links; configurable TTL |

**Production checklist:**

- [ ] Change `SECRET_KEY` to a cryptographically random value.
- [ ] Set `DATABASE_URL` to a production PostgreSQL instance.
- [ ] Set `ENVIRONMENT=production` and `RELOAD=false`.
- [ ] Restrict `ALLOWED_ORIGINS` to your production frontend URL.
- [ ] Enable `EMAIL_VERIFICATION_REQUIRED=true` with valid SMTP credentials.
- [ ] Set `ENABLED_DOMAINS` appropriately for the deployment.

---

## 9. Directory Structure Reference

```
safetymindpro/
├── backend/
│   ├── algorithms/          # Universal analysis algorithms
│   │   ├── functional_analysis.py
│   │   ├── risk_analysis.py
│   │   ├── structural_analysis.py
│   │   └── timeseries_analysis.py
│   ├── config/              # Additional config helpers
│   ├── core/                # Core graph abstractions
│   │   ├── domain_mapper.py
│   │   ├── graph.py
│   │   └── universal_graph.py
│   ├── domains/             # Domain plugin packages
│   │   ├── automotive/
│   │   ├── finance/
│   │   ├── financial/
│   │   ├── process_plant/
│   │   ├── trading/
│   │   ├── base.py          # DomainAdapter base class
│   │   └── registry.py      # Singleton domain registry
│   ├── routers/             # FastAPI route handlers
│   │   ├── auth.py
│   │   ├── diagrams.py
│   │   ├── domains.py       # v1 + v2 routers; ENABLED_DOMAINS filter
│   │   ├── fmea.py
│   │   └── privacy.py
│   ├── app.py               # FastAPI application factory
│   ├── config.py            # pydantic-settings Settings class
│   ├── database.py          # SQLAlchemy engine + session
│   └── models.py            # ORM models (User, Graph, FMEARecord)
│
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── auth.js
│       │   └── domains.js   # Axios wrappers for domain endpoints
│       ├── components/
│       │   ├── GraphEditor.js   # Canvas, layer views, CascadedTreeMap
│       │   ├── GraphEditor.css
│       │   ├── WorkspacePage.js # Main app shell; domain isolation filter
│       │   ├── WorkspacePage.css
│       │   └── …
│       ├── pages/
│       └── App.js           # Router + auth state
│
├── docs/
│   ├── SOFTWARE_ARCHITECTURE.md  ← this document
│   └── …
│
├── .env.example             # Template for all env vars
├── LICENSE                  # Proprietary licence
└── requirements.txt         # Python dependencies
```

---

## 10. Extension Guide — Adding a New Domain

1. **Create the domain package:**
   ```
   backend/domains/my_domain/
     __init__.py
     adapter.py       ← subclass DomainAdapter
     mapper.py        ← subclass DomainMapper
   ```

2. **Implement `DomainAdapter`** (in `adapter.py`):
   - Define `domain_name`, `domain_display_name`, `description`.
   - Return `NodeType` / `EdgeType` / `Algorithm` lists.
   - Implement `validate_node`, `validate_edge`, `enrich_node`, `get_styling_config`.

3. **Implement `DomainMapper`** (in `mapper.py`):
   - Implement `map_to_universal_graph(domain_data)`.
   - Implement `format_results(results, graph)`.

4. **Register in `backend/domains/__init__.py`:**
   ```python
   from backend.domains.my_domain.adapter import MyDomainAdapter
   from backend.domains.my_domain.mapper  import MyDomainMapper
   from backend.domains.registry import registry

   registry.register(MyDomainAdapter())
   registry.register_mapper(MyDomainMapper())
   ```

5. **Add domain icon** in `frontend/src/components/DomainSelector.js`:
   ```js
   const domainIcons = {
     ...
     my_domain: '🔬',
   };
   ```

6. **Enable in deployment** — add `my_domain` to `ENABLED_DOMAINS` in `.env`.

No changes to routers, algorithms, or core graph code are required.
