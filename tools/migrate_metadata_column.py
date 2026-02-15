#!/usr/bin/env python3
"""
Migration script to rename 'metadata' column to 'graph_metadata' in universal_graphs table.

This script handles the SQLAlchemy reserved attribute issue by renaming the column
in existing databases.

Usage:
    python tools/migrate_metadata_column.py
"""

import os
import sys
import sqlite3
from pathlib import Path

def migrate_sqlite(db_path: str) -> bool:
    """
    Migrate SQLite database to rename metadata column.
    
    Args:
        db_path: Path to SQLite database file
        
    Returns:
        True if successful, False otherwise
    """
    print(f"Migrating SQLite database: {db_path}")
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    # Create backup
    backup_path = f"{db_path}.backup"
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup created: {backup_path}")
    except Exception as e:
        print(f"⚠️  Warning: Could not create backup: {e}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if universal_graphs table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='universal_graphs'
        """)
        
        if not cursor.fetchone():
            print("ℹ️  Table 'universal_graphs' does not exist. Nothing to migrate.")
            conn.close()
            return True
        
        # Check if metadata column exists
        cursor.execute("PRAGMA table_info(universal_graphs)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'metadata' not in columns:
            print("ℹ️  Column 'metadata' does not exist. Migration may have already been applied.")
            if 'graph_metadata' in columns:
                print("✅ Column 'graph_metadata' already exists. Database is up to date.")
            conn.close()
            return True
        
        print("🔄 Starting migration...")
        
        # Execute migration
        cursor.execute("BEGIN TRANSACTION")
        
        # Create new table with correct schema
        cursor.execute("""
            CREATE TABLE universal_graphs_new (
                id INTEGER PRIMARY KEY,
                graph_id INTEGER,
                domain VARCHAR NOT NULL,
                form_elements JSON,
                functions JSON,
                failure_modes JSON,
                function_branches JSON,
                failure_branches JSON,
                graph_metadata JSON,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY(graph_id) REFERENCES graphs (id)
            )
        """)
        
        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO universal_graphs_new
            SELECT id, graph_id, domain, form_elements, functions, failure_modes,
                   function_branches, failure_branches, metadata, created_at, updated_at
            FROM universal_graphs
        """)
        
        # Drop old table
        cursor.execute("DROP TABLE universal_graphs")
        
        # Rename new table
        cursor.execute("ALTER TABLE universal_graphs_new RENAME TO universal_graphs")
        
        cursor.execute("COMMIT")
        
        print("✅ Migration completed successfully!")
        print("   - Renamed column: metadata → graph_metadata")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        try:
            cursor.execute("ROLLBACK")
            conn.close()
        except:
            pass
        
        # Attempt to restore from backup
        if os.path.exists(backup_path):
            print(f"🔄 Attempting to restore from backup...")
            try:
                import shutil
                shutil.copy2(backup_path, db_path)
                print(f"✅ Restored from backup")
            except Exception as restore_error:
                print(f"❌ Could not restore from backup: {restore_error}")
        
        return False


def main():
    """Main migration function"""
    print("=" * 70)
    print("SafetyMindPro Database Migration")
    print("Renaming 'metadata' to 'graph_metadata' in universal_graphs table")
    print("=" * 70)
    print()
    
    # Default database path
    default_db = "safetymindpro.db"
    
    # Check for environment variable
    db_url = os.getenv("DATABASE_URL", f"sqlite:///./{default_db}")
    
    if "sqlite" in db_url:
        # Extract path from SQLite URL
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if db_path.startswith("./"):
            db_path = db_path[2:]
        
        success = migrate_sqlite(db_path)
        
        if success:
            print()
            print("=" * 70)
            print("✅ Migration completed successfully!")
            print("=" * 70)
            print()
            print("Next steps:")
            print("1. Verify the application starts: python -m backend.app")
            print("2. Check for any errors in the logs")
            print(f"3. If issues occur, restore from backup: {db_path}.backup")
            sys.exit(0)
        else:
            print()
            print("=" * 70)
            print("❌ Migration failed!")
            print("=" * 70)
            sys.exit(1)
    else:
        print(f"⚠️  Non-SQLite database detected: {db_url}")
        print()
        print("For PostgreSQL, MySQL, or other databases, please run the appropriate")
        print("SQL commands manually. See MIGRATION_GUIDE.md for instructions.")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
