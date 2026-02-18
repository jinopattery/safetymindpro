# Diagram Storage Documentation

## Overview
This document provides comprehensive documentation on how diagram information is saved for each user in the SafetyMindPro automotive domain, including storage format, data structure, and usage examples.

## Storage Architecture

### Database Tables

#### FMEAAnalysis Table
The main table for storing FMEA (Failure Mode and Effects Analysis) data, which includes diagram information.

**Table Name:** `fmea_analyses`

**Columns:**
- `id` (Integer, Primary Key) - Unique identifier for the analysis
- `name` (String) - Name of the FMEA analysis
- `description` (Text) - **This field stores all diagram data as JSON**
- `system` (String) - System name (e.g., "Brake System")
- `subsystem` (String) - Optional subsystem name
- `owner_id` (Integer, Foreign Key) - Reference to the user who owns this analysis
- `created_at` (DateTime) - Timestamp when the analysis was created
- `updated_at` (DateTime) - Timestamp when the analysis was last updated

**Relationships:**
- `owner` - Many-to-one relationship with User table
- `failure_modes` - One-to-many relationship with FailureMode table

#### FailureMode Table
Stores individual failure modes associated with an FMEA analysis.

**Table Name:** `failure_modes`

**Columns:**
- `id` (Integer, Primary Key)
- `analysis_id` (Integer, Foreign Key) - Reference to FMEAAnalysis
- `component` (String) - Component name
- `function` (String) - Component function
- `failure_mode` (String) - Description of failure mode
- `failure_effects` (Text) - Effects of the failure
- `failure_causes` (Text) - Causes of the failure
- `severity` (Integer, 1-10) - Severity rating
- `occurrence` (Integer, 1-10) - Occurrence rating
- `detection` (Integer, 1-10) - Detection rating
- `rpn` (Integer) - Risk Priority Number (severity × occurrence × detection)
- `current_controls` (Text) - Optional current control measures
- `recommended_actions` (Text) - Optional recommended actions
- `responsibility` (String) - Optional responsible person/team
- `target_date` (DateTime) - Optional target completion date
- `created_at` (DateTime)
- `updated_at` (DateTime)

## Diagram Storage Format

### Storage Location
All diagrams for an FMEA analysis are stored as a JSON object in the `description` field of the `fmea_analyses` table.

### JSON Structure
The `description` field contains a JSON object where each key represents a diagram type, and the value contains the diagram data:

```json
{
  "block": {
    "name": "Block Diagram",
    "type": "block",
    "nodes": [...],
    "edges": [...],
    "metadata": {...},
    "saved_at": "2024-01-01T12:00:00.000Z"
  },
  "structure": {
    "name": "System Structure",
    "type": "structure",
    "nodes": [...],
    "edges": [...],
    "metadata": {...},
    "saved_at": "2024-01-01T12:00:00.000Z"
  },
  "fta": {
    "name": "Fault Tree Analysis",
    "type": "fta",
    "nodes": [...],
    "edges": [...],
    "metadata": {...},
    "saved_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Diagram Types

#### 1. Block Diagram (`block`)
Represents the block-level view of the system showing input-process-output relationships.

**Node Structure:**
```json
{
  "id": "node-1",
  "type": "input|default|output",
  "data": {
    "label": "Component Name"
  },
  "position": {
    "x": 100,
    "y": 150
  },
  "style": {
    "background": "#3498db",
    "color": "white",
    "padding": "12px",
    "borderRadius": "5px"
  }
}
```

**Edge Structure:**
```json
{
  "id": "e1-2",
  "source": "node-1",
  "target": "node-2",
  "animated": true,
  "style": {}
}
```

#### 2. System Structure Diagram (`structure`)
Represents the hierarchical structure of the system and its components.

**Node Structure:** Same as block diagram, typically uses `type: "default"`

**Edge Structure:** Same as block diagram

#### 3. Fault Tree Analysis Diagram (`fta`)
Represents fault tree analysis with logic gates and events.

**Node Structure:** Similar to block diagram with additional fault tree specific properties

## API Endpoints

### Save Diagram
**Endpoint:** `POST /api/v1/diagrams/save`

**Request Body:**
```json
{
  "analysis_id": 1,
  "diagram_type": "block",
  "name": "Block Diagram",
  "nodes": [
    {
      "id": "node-1",
      "type": "input",
      "data": {"label": "Input Component"},
      "position": {"x": 50, "y": 150},
      "style": {"background": "#3498db", "color": "white"}
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "node-1",
      "target": "node-2",
      "animated": true
    }
  ],
  "metadata": {
    "domain": "automotive",
    "version": "1.0"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Diagram saved successfully",
  "diagram_type": "block",
  "analysis_id": 1
}
```

### Load Diagram
**Endpoint:** `GET /api/v1/diagrams/load/{analysis_id}/{diagram_type}`

**URL Parameters:**
- `analysis_id` - The ID of the FMEA analysis
- `diagram_type` - Type of diagram to load (`block`, `structure`, `fta`)

**Response (200 OK):**
```json
{
  "name": "Block Diagram",
  "type": "block",
  "nodes": [...],
  "edges": [...],
  "metadata": {...},
  "saved_at": "2024-01-01T12:00:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Analysis not found"
}
```
or
```json
{
  "detail": "Diagram not found"
}
```

## User-Specific Storage

### Data Isolation
Each FMEA analysis can be associated with a specific user through the `owner_id` foreign key. 

**Current Implementation:**
- The `owner_id` field is currently nullable (optional)
- This allows for analyses without user ownership for testing and migration
- The system works with or without user authentication

**Future Enhancement:**
For proper multi-tenancy and data isolation, the following should be implemented:
- Make `owner_id` required (nullable=False) for all new analyses
- Update FMEA creation endpoints to automatically set owner_id from authenticated user
- Add access control checks to ensure users can only access their own analyses
- Implement role-based permissions for shared analyses

### Access Pattern (Current)
1. User creates or selects an FMEA analysis (with or without authentication)
2. User creates/modifies diagrams through the frontend
3. Diagrams are saved to the analysis
4. Any user with the analysis ID can load the diagrams

### Access Pattern (Recommended Future Implementation)
1. User authenticates and receives a user ID
2. User creates an FMEA analysis (owner_id automatically set)
3. User creates/modifies diagrams through the frontend
4. Diagrams are saved to the analysis associated with that user
5. Only the owner (or users with appropriate permissions) can load the diagrams

## Frontend Integration

### React Flow Components
The frontend uses React Flow library for diagram rendering:
- `BlockDiagram.js` - Handles block diagrams
- `SystemStructure.js` - Handles system structure diagrams
- `FTADetail.js` - Handles fault tree analysis diagrams

### Save Flow
1. User modifies diagram in React Flow component
2. User clicks "Save" button
3. Frontend calls `POST /api/v1/diagrams/save` with current nodes and edges
4. Backend stores diagram data in database
5. User receives confirmation message

### Load Flow
1. Page loads with `analysisId` parameter
2. Component calls `GET /api/v1/diagrams/load/{analysisId}/{type}`
3. Backend retrieves diagram from database
4. Frontend renders nodes and edges in React Flow

## Storage Considerations

### Data Format
- **Format:** JSON (JavaScript Object Notation)
- **Encoding:** UTF-8
- **Storage:** Text field in SQLite/PostgreSQL database
- **Size Limit:** Determined by database text field limits (typically very large)

### Performance
- Diagrams are loaded on-demand per type
- JSON parsing is efficient for typical diagram sizes
- Consider implementing pagination for very large diagrams

### Backup and Export
- All diagram data is stored in the database
- Standard database backup procedures apply
- Diagrams can be exported as part of FMEA analysis exports

## Data Versioning

### Timestamp Tracking
Each diagram includes a `saved_at` timestamp to track when it was last modified.

### Version History
Currently, the system stores only the latest version of each diagram type. Future enhancements could include:
- Version history tracking
- Rollback capabilities
- Change audit logs

## Security Considerations

### Data Protection
- Diagram data is stored in the database
- **Note:** Current implementation does not enforce user ownership for FMEA analyses
- Future enhancement: Access control through authentication system
- SQL injection protection through SQLAlchemy ORM
- No sensitive data should be stored in diagram labels

### Best Practices
1. **Future:** Always validate user ownership before loading diagrams
2. Sanitize diagram data before rendering in frontend
3. Implement rate limiting for save operations
4. Regular database backups
5. **Recommended:** Update FMEA creation to require and set owner_id from authenticated user

## Example Usage

### Creating and Saving a Complete Automotive Brake System Diagram

```python
import requests

# 1. Create FMEA Analysis
analysis = requests.post("http://localhost:8000/api/v1/fmea/analyses", json={
    "name": "Brake System FMEA",
    "description": "Automotive brake system analysis",
    "system": "Brake System",
    "subsystem": "Hydraulic"
}).json()

analysis_id = analysis['id']

# 2. Save Block Diagram
requests.post("http://localhost:8000/api/v1/diagrams/save", json={
    "analysis_id": analysis_id,
    "diagram_type": "block",
    "name": "Brake System Block Diagram",
    "nodes": [
        {
            "id": "pedal",
            "type": "input",
            "data": {"label": "Brake Pedal"},
            "position": {"x": 50, "y": 150}
        },
        {
            "id": "pump",
            "type": "default",
            "data": {"label": "Hydraulic Pump"},
            "position": {"x": 250, "y": 150}
        },
        {
            "id": "caliper",
            "type": "output",
            "data": {"label": "Brake Caliper"},
            "position": {"x": 450, "y": 150}
        }
    ],
    "edges": [
        {"id": "e1", "source": "pedal", "target": "pump"},
        {"id": "e2", "source": "pump", "target": "caliper"}
    ]
})

# 3. Load the diagram later
diagram = requests.get(
    f"http://localhost:8000/api/v1/diagrams/load/{analysis_id}/block"
).json()

print(f"Loaded diagram with {len(diagram['nodes'])} nodes")
```

## Troubleshooting

### Diagram Not Saving
- Check that the analysis_id exists
- Verify user has permission to modify the analysis
- Check for JSON serialization errors in the request

### Diagram Not Loading
- Verify the diagram type has been saved
- Check that the analysis_id is correct
- Ensure user has permission to view the analysis

### Data Corruption
- If JSON parsing fails, the description field may contain invalid JSON
- The system will return an empty diagram in this case
- Use database backup to restore corrupted data

## Future Enhancements

Planned improvements for diagram storage:
1. **User authentication and access control** - Enforce owner_id requirement and implement proper access control
2. Separate table for diagram data (better performance for large diagrams)
3. Version control and history tracking
4. Real-time collaborative editing
5. Diagram templates for common automotive systems
6. Export to standard formats (SVG, PNG, PDF)
7. Import from other FMEA tools

## Support

For issues or questions about diagram storage:
- Check API documentation at `/docs`
- Review database schema in `backend/models.py`
- Examine frontend components in `frontend/src/components/`
- Contact the development team for assistance
