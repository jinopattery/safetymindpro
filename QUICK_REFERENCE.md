# Quick Reference: SQLAlchemy Reserved Attributes

## Issue Fixed
This PR fixes the `InvalidRequestError: Attribute name 'metadata' is reserved when using the Declarative API` error.

## What Changed
- **Column Name**: `metadata` → `graph_metadata` in `UniversalGraphData` model
- **Python Attribute**: `obj.metadata` → `obj.graph_metadata` in all graph classes

## For Developers

### Using the Graph Classes

**Before:**
```python
graph = UniversalGraph()
graph.metadata = {'domain': 'automotive'}
data = graph.to_dict()  # Returns: {'metadata': {...}}
```

**After:**
```python
graph = UniversalGraph()
graph.graph_metadata = {'domain': 'automotive'}
data = graph.to_dict()  # Returns: {'graph_metadata': {...}}
```

### Database Migration

**For Development/Test (SQLite):**
```bash
# Option 1: Delete and recreate
rm safetymindpro.db
python -m backend.app  # Creates new schema

# Option 2: Run migration script
python tools/migrate_metadata_column.py
```

**For Production:**
See `MIGRATION_GUIDE.md` for detailed instructions.

### Backward Compatibility

Old data with `metadata` key is automatically handled:
```python
# Old format still works
old_data = {'metadata': {'domain': 'test'}}
graph = UniversalGraph.from_dict(old_data)
# graph.graph_metadata now contains the data
```

## SQLAlchemy Reserved Attributes to Avoid

⚠️ **Do not use these as column names in SQLAlchemy models:**

- `metadata` - Used by SQLAlchemy's declarative base
- `query` - Used in some SQLAlchemy configurations
- `registry` - Used internally by SQLAlchemy
- Other internal attributes listed in [SQLAlchemy documentation](https://docs.sqlalchemy.org/en/20/orm/mapping_api.html)

## Quick Verification

Test that the fix works:
```bash
# Should start without errors
python -m backend.app
```

Expected output:
```
INFO:__main__:Database tables created successfully
INFO:__main__:SafetyMindPro API Starting...
```

**No `InvalidRequestError` should appear!**

## Files Modified

### Core Changes
- `backend/models.py` - Database model
- `backend/core/universal_graph.py` - Universal graph class
- `backend/core/graph.py` - Base graph class

### Domain Mappers
- `backend/domains/automotive/mapper.py`
- `backend/domains/financial/mapper.py`
- `backend/domains/trading/mapper.py`
- `backend/domains/process_plant/mapper.py`

### New Files
- `MIGRATION_GUIDE.md` - Detailed migration instructions
- `tools/migrate_metadata_column.py` - Automated migration script
- `QUICK_REFERENCE.md` - This file

## Need Help?

- See `MIGRATION_GUIDE.md` for detailed migration instructions
- Check the PR description for comprehensive change documentation
- Run `python tools/migrate_metadata_column.py --help` (when implemented)
