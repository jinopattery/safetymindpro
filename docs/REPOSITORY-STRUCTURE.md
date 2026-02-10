safetymindpro/
│
├── backend/
│   ├── app.py                          # FastAPI application entry
│   ├── config.py                       # General config, env, settings
│   ├── database.py                     # Database connection/init
│   ├── models.py                       # ORM models (global/shared)
│   ├── schemas.py                      # Pydantic API schemas
│   ├── dependencies.py                 # Dependencies (e.g., user getter)
│   ├── permissions.py                  # RBAC/permission logic
│   │
│   ├── core/
│   │   ├── graph.py                    # Universal graph logic
│   │   ├── algorithms.py               # Graph algorithms
│   │   └── utils.py                    # Cross-domain/core utils
│   │
│   ├── domains/
│   │   ├── base.py                     # Domain adapter ABC
│   │   ├── registry.py                 # Registry/autodiscovery logic
│   │   ├── __init__.py
│   │   ├── automotive/
│   │   │   ├── adapter.py
│   │   │   ├── models.py
│   │   │   └── calculations.py
│   │   ├── process_plant/
│   │   │   ├── adapter.py
│   │   │   └── models.py
│   │   ├── financial/
│   │   │   ├── adapter.py
│   │   │   └── models.py
│   │   └── trading/
│   │       ├── adapter.py
│   │       └── models.py
│   │
│   ├── config/
│   │   ├── loader.py                   # YAML/domain config loader
│   │   └── domains/
│   │       ├── automotive.yaml
│   │       ├── process_plant.yaml
│   │       ├── financial.yaml
│   │       └── trading.yaml
│   │
│   ├── routers/
│   │   ├── domains.py                  # Main multi-domain API
│   │   ├── fmea.py                     # Legacy
│   │   ├── fta.py                      # Legacy
│   │   ├── auth.py                     # User authentication (login, signup, token, etc.)
│   │   ├── users.py                    # User profile/change management
│   │   └── admin.py                    # Admin/user management endpoints (list, suspend, etc.)
│   │
│   ├── auth/
│   │   ├── jwt.py                      # JWT creation/validation
│   │   ├── passwords.py                # Hash/verify helpers
│   │   ├── oauth.py                    # (Optional) OAuth/backends
│   │   └── utils.py                    # Email/token helpers
│   │
│   ├── security/
│   │   ├── cors.py                     # CORS configuration
│   │   ├── ratelimit.py                # Rate limiting
│   │   ├── csrf.py                     # CSRF protection (if needed)
│   │   └── audit.py                    # Audit/event logging
│   │
│   ├── utils/
│   │   └── ...                         # Shared/global helpers
│   │
│   ├── admin/
│   │   └── dashboard.py                # Optional admin actions/views
│   │
│   ├── alembic/                        # DB migration scripts
│   │
│   └── tests/
│       ├── test_auth.py
│       ├── test_users.py
│       ├── test_domains.py
│       ├── test_algorithms.py
│       └── ...                         # Coverage for all layers
│
├── frontend/
│   ├── public/
│   │   └── index.html                  # HTML shell
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.js
│       ├── App.css
│       ├── api/                        # API service modules
│       │   ├── auth.js                 # Auth/user API
│       │   └── domains.js              # Domain graph/algorithm API
│       ├── store/                      # App state (Redux or similar)
│       ├── components/
│       │   ├── DomainSelector.js
│       │   ├── GraphEditor.js
│       │   ├── AlgorithmPanel.js
│       │   ├── ResultsPanel.js
│       │   │
│       │   ├── Auth/                   # Auth flows - new
│       │   │   ├── LoginForm.js
│       │   │   ├── SignupForm.js
│       │   │   ├── ForgotPassword.js
│       │   │   └── ResetPassword.js
│       │   ├── User/                   # User profile/settings - new
│       │   │   ├── UserProfile.js
│       │   │   └── UserSettings.js
│       │   ├── Admin/                  # Admin dashboard - new
│       │   │   └── UserManagement.js
│       │   └── ...
│       ├── routes/                     # Route definitions (optional)
│       └── utils/
│           └── ...                     # Shared helpers
│
├── examples/
│   ├── automotive_fmea_example.py
│   ├── process_plant_monitoring_example.py
│   ├── financial_fraud_example.py
│   └── trading_portfolio_example.py
│
├── tools/
│   └── domain_generator.py
│
├── docs/
│   ├── Implementation-Guide.md
│   ├── SafetyMindPro-Architecture-Documentation.md
│   ├── FULLSTACK-SETUP-GUIDE.md
│   ├── Auth-Setup.md                      # User mgmt/auth overview
│   ├── RBAC.md                            # Roles and permissions design
│   ├── README-COMPLETE-FULLSTACK.md
│   └── README-Final-Implementation.md
│
├── migrations/                        # DB migrations (e.g. Alembic)
│
├── requirements.txt                   # Python deps (see fastapi-users, passlib, pyjwt)
├── setup.sh
├── LICENSE
├── .env.example                       # Template for secrets/config
├── README.md
└── .gitignore
