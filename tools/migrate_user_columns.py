#!/usr/bin/env python3
"""
Migration script to add email-verification and GDPR consent columns to the users table.

New columns added to users:
  - email_verified           BOOLEAN   DEFAULT 0
  - email_verification_token VARCHAR
  - email_verification_sent_at DATETIME
  - gdpr_consent_at          DATETIME
  - gdpr_consent_version     VARCHAR   DEFAULT '1.0'

Usage:
    python tools/migrate_user_columns.py
"""

import os
import re
import sys
import shutil
import sqlite3


NEW_COLUMNS = [
    ("email_verified", "BOOLEAN DEFAULT 0"),
    ("email_verification_token", "VARCHAR"),
    ("email_verification_sent_at", "DATETIME"),
    ("gdpr_consent_at", "DATETIME"),
    ("gdpr_consent_version", "VARCHAR DEFAULT '1.0'"),
]

# Only allow safe identifiers and simple type definitions (defence-in-depth)
_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def migrate_sqlite(db_path: str) -> bool:
    """
    Add missing email-verification / GDPR columns to the users table.

    Args:
        db_path: Path to SQLite database file

    Returns:
        True if successful, False otherwise
    """
    print(f"Migrating SQLite database: {db_path}")

    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False

    # Create backup
    backup_path = f"{db_path}.backup"
    try:
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup created: {backup_path}")
    except Exception as e:
        print(f"⚠️  Warning: Could not create backup: {e}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if users table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        if not cursor.fetchone():
            print("ℹ️  Table 'users' does not exist. Nothing to migrate.")
            conn.close()
            return True

        # Get existing columns
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = {row[1] for row in cursor.fetchall()}

        added = []
        for col_name, col_def in NEW_COLUMNS:
            if col_name in existing_columns:
                print(f"ℹ️  Column '{col_name}' already exists. Skipping.")
                continue
            if not _SAFE_IDENTIFIER.match(col_name):
                print(f"❌ Skipping unsafe column name: {col_name}")
                continue
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            added.append(col_name)
            print(f"✅ Added column: {col_name}")

        conn.commit()
        conn.close()

        if not added:
            print("ℹ️  All columns already present. Database is up to date.")
        else:
            print(f"✅ Migration completed: added {len(added)} column(s).")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        try:
            conn.close()
        except Exception:
            pass

        if os.path.exists(backup_path):
            print("🔄 Attempting to restore from backup...")
            try:
                shutil.copy2(backup_path, db_path)
                print("✅ Restored from backup")
            except Exception as restore_error:
                print(f"❌ Could not restore from backup: {restore_error}")

        return False


def main():
    """Main migration entry point."""
    print("=" * 70)
    print("SafetyMindPro Database Migration")
    print("Adding email-verification and GDPR columns to users table")
    print("=" * 70)
    print()

    db_url = os.getenv("DATABASE_URL", "sqlite:///./safetymindpro.db")

    if "sqlite" in db_url:
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if db_path.startswith("./"):
            db_path = db_path[2:]

        success = migrate_sqlite(db_path)

        print()
        print("=" * 70)
        if success:
            print("✅ Migration completed successfully!")
            print("=" * 70)
            print()
            print("Next steps:")
            print("1. Start the application: python -m backend.app")
            print("2. Check for any errors in the logs")
            print(f"3. If issues occur, restore from backup: {db_path}.backup")
            sys.exit(0)
        else:
            print("❌ Migration failed!")
            print("=" * 70)
            sys.exit(1)
    else:
        print(f"⚠️  Non-SQLite database detected: {db_url}")
        print()
        print("For PostgreSQL, run the following SQL (requires PostgreSQL 9.6+):")
        print()
        for col_name, col_def in NEW_COLUMNS:
            print(f"  ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def};")
        print()
        print("For MySQL/MariaDB, check for each column first, then run:")
        print()
        for col_name, col_def in NEW_COLUMNS:
            print(f"  ALTER TABLE users ADD COLUMN {col_name} {col_def};")
        print("  (Skip any that already exist to avoid errors.)")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
