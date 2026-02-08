"""
Diagram API endpoints for saving/loading visual diagrams
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models import FMEAAnalysis as FMEAModel
from datetime import datetime

router = APIRouter(prefix="/api/v1/diagrams", tags=["Diagrams"])


class DiagramNode(BaseModel):
    id: str
    type: str
    data: dict
    position: dict
    style: Optional[dict] = None


class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: Optional[bool] = False
    style: Optional[dict] = None


class DiagramSave(BaseModel):
    analysis_id: int
    diagram_type: str
    name: str
    nodes: List[DiagramNode]
    edges: List[DiagramEdge]
    metadata: Optional[dict] = None


@router.post("/save", status_code=201)
def save_diagram(diagram: DiagramSave, db: Session = Depends(get_db)):
    """Save a diagram with nodes and edges"""
    
    analysis = db.query(FMEAModel).filter(FMEAModel.id == diagram.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    import json
    try:
        stored_diagrams = json.loads(analysis.description) if analysis.description and analysis.description.startswith('{') else {}
    except:
        stored_diagrams = {}
    
    diagram_data = {
        'name': diagram.name,
        'type': diagram.diagram_type,
        'nodes': [node.model_dump() for node in diagram.nodes],
        'edges': [edge.model_dump() for edge in diagram.edges],
        'metadata': diagram.metadata,
        'saved_at': datetime.utcnow().isoformat()
    }
    
    stored_diagrams[diagram.diagram_type] = diagram_data
    analysis.description = json.dumps(stored_diagrams)
    
    db.commit()
    
    return {
        "message": "Diagram saved successfully",
        "diagram_type": diagram.diagram_type,
        "analysis_id": diagram.analysis_id
    }


@router.get("/load/{analysis_id}/{diagram_type}")
def load_diagram(analysis_id: int, diagram_type: str, db: Session = Depends(get_db)):
    """Load a saved diagram"""
    
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    import json
    try:
        stored_diagrams = json.loads(analysis.description) if analysis.description and analysis.description.startswith('{') else {}  
        
        if diagram_type in stored_diagrams:
            return stored_diagrams[diagram_type]
        else:
            raise HTTPException(status_code=404, detail="Diagram not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=404, detail="No diagrams found")
