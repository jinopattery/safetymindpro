# Database Migration Guide

## SQLAlchemy Reserved Attribute Fix - `metadata` to `graph_metadata`

This migration addresses the SQLAlchemy `InvalidRequestError` caused by using the reserved attribute name `metadata` in the `UniversalGraphData` model.

### Changes Made

- **Column Rename**: `UniversalGraphData.metadata` → `UniversalGraphData.graph_metadata`
- **Code Updates**: All references to the `metadata` attribute in UniversalGraph and Graph classes have been updated to `graph_metadata`

### Migration Options

#### Option 1: Development/Test Environment (Recommended for SQLite)

If you're using a development or test database and can afford to recreate tables:

```bash
# Backup your database (if needed)
cp safetymindpro.db safetymindpro.db.backup

# Delete the existing database
rm safetymindpro.db

# Restart the application - it will create tables with the new schema
python -m backend.app
```

#### Option 2: Production Environment (SQL-based migration)

For production databases where you need to preserve data:

**SQLite:**
```sql
-- SQLite doesn't support column rename directly, so we need to recreate the table
BEGIN TRANSACTION;

-- Create new table with correct schema
CREATE TABLE universal_graphs_new (
    id INTEGER PRIMARY KEY,
    graph_id INTEGER,
    domain VARCHAR NOT NULL,
    form_elements JSON,
    functions JSON,
    failure_modes JSON,
    function_branches JSON,
    failure_branches JSON,
    graph_metadata JSON,  -- Renamed from metadata
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY(graph_id) REFERENCES graphs (id)
);

-- Copy data from old table
INSERT INTO universal_graphs_new
SELECT id, graph_id, domain, form_elements, functions, failure_modes, 
       function_branches, failure_branches, metadata, created_at, updated_at
FROM universal_graphs;

-- Drop old table and rename new table
DROP TABLE universal_graphs;
ALTER TABLE universal_graphs_new RENAME TO universal_graphs;

COMMIT;
```

**PostgreSQL:**
```sql
ALTER TABLE universal_graphs 
RENAME COLUMN metadata TO graph_metadata;
```

**MySQL:**
```sql
ALTER TABLE universal_graphs 
CHANGE COLUMN metadata graph_metadata JSON;
```

#### Option 3: Using Alembic (if configured)

If you have Alembic configured in your project:

```bash
# Generate migration
alembic revision -m "rename_metadata_to_graph_metadata"
```

Edit the generated migration file to include:

**For SQLite (requires table recreation):**
```python
def upgrade():
    # SQLite doesn't support column rename, so we recreate the table
    op.execute("""
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
    
    op.execute("""
        INSERT INTO universal_graphs_new
        SELECT id, graph_id, domain, form_elements, functions, failure_modes,
               function_branches, failure_branches, metadata, created_at, updated_at
        FROM universal_graphs
    """)
    
    op.execute("DROP TABLE universal_graphs")
    op.execute("ALTER TABLE universal_graphs_new RENAME TO universal_graphs")

def downgrade():
    # Reverse the migration
    pass
```

**For PostgreSQL/MySQL (direct column rename):**
```python
def upgrade():
    with op.batch_alter_table('universal_graphs') as batch_op:
        batch_op.alter_column('metadata', new_column_name='graph_metadata')

def downgrade():
    with op.batch_alter_table('universal_graphs') as batch_op:
        batch_op.alter_column('graph_metadata', new_column_name='metadata')
```

Then apply the migration:
```bash
alembic upgrade head
```

### Verification

After migration, verify the application starts without errors:

```bash
python -m backend.app
```

You should see:
```
INFO:__main__:Database tables created successfully
INFO:__main__:SafetyMindPro API Starting...
```

**No** `InvalidRequestError` should appear.

### Backward Compatibility

The code includes backward compatibility in the `from_dict()` methods:
```python
graph.graph_metadata = data.get('graph_metadata', data.get('metadata', {}))
```

This allows loading old serialized data that still uses the `metadata` key.

### Important Note

⚠️ **Avoid using SQLAlchemy reserved attributes** in future model definitions:
- `metadata` - Reserved by SQLAlchemy's declarative base
- `query` - Reserved in some SQLAlchemy configurations
- Other reserved names listed in SQLAlchemy documentation

A warning comment has been added to the `UniversalGraphData` model to prevent this issue in the future.
