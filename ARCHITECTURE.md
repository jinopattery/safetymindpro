## Architecture Diagram

```mermaid
flowchart TD
    U[User Browser] --> F[Frontend: React.js]
    F -- REST API --> B[Backend: FastAPI]
    B -- ORM --> D[SQLite Database]
    F -- File Upload/Export --> B
```




