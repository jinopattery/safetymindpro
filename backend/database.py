"""
Database configuration and session management
"""
from sqlalchemy import create_engine, text, inspect as sa_inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import re
import logging

logger = logging.getLogger(__name__)

# Database URL - using SQLite for simplicity
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./safetymindpro.db")

# Create engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Columns to add to the users table if they are missing.
# Each entry is (column_name, column_definition).  Values are hardcoded
# constants – never derived from user input.
_USERS_MIGRATIONS = [
    ("email_verified", "BOOLEAN DEFAULT 0"),
    ("email_verification_token", "VARCHAR"),
    ("email_verification_sent_at", "DATETIME"),
    ("gdpr_consent_at", "DATETIME"),
    ("gdpr_consent_version", "VARCHAR DEFAULT '1.0'"),
]

# Only allow safe identifiers and simple type definitions
_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _migrate_users_table(conn, existing_columns: set) -> None:
    """Add any missing columns to the users table."""
    for col_name, col_def in _USERS_MIGRATIONS:
        if col_name in existing_columns:
            continue
        # Validate that col_name is a safe identifier (defence-in-depth)
        if not _SAFE_IDENTIFIER.match(col_name):
            logger.error("Skipping unsafe column name: %s", col_name)
            continue
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
            logger.info("Added missing column users.%s", col_name)
        except Exception as exc:
            logger.warning("Could not add column users.%s: %s", col_name, exc)


def migrate_db() -> None:
    """Apply any pending schema migrations before create_all."""
    inspector = sa_inspect(engine)
    if "users" not in inspector.get_table_names():
        # Table doesn't exist yet; create_all will handle it
        return
    existing_columns = {col["name"] for col in inspector.get_columns("users")}
    with engine.begin() as conn:
        _migrate_users_table(conn, existing_columns)


# Initialize database
def init_db():
    """Initialize database tables"""
    migrate_db()
    Base.metadata.create_all(bind=engine)