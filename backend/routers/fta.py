"""
Fault Tree Analysis API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import FaultTree as FaultTreeModel
from backend.schemas import FaultTree, FaultTreeCreate

router = APIRouter(prefix="/api/v1/fta", tags=["Fault Tree Analysis"])


@router.post("/trees", response_model=FaultTree, status_code=201)
def create_fault_tree(tree: FaultTreeCreate, db: Session = Depends(get_db)):
    """Create a new fault tree"""
    db_tree = FaultTreeModel(
        name=tree.name,
        description=tree.description,
        top_event=tree.top_event,
        nodes=[node.model_dump() for node in tree.nodes],
        edges=[edge.model_dump() for edge in tree.edges]
    )
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return db_tree


@router.get("/trees", response_model=List[FaultTree])
def list_fault_trees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all fault trees"""
    trees = db.query(FaultTreeModel).offset(skip).limit(limit).all()
    return trees


@router.get("/trees/{tree_id}", response_model=FaultTree)
def get_fault_tree(tree_id: int, db: Session = Depends(get_db)):
    """Get a specific fault tree"""
    tree = db.query(FaultTreeModel).filter(FaultTreeModel.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Fault tree not found")
    return tree


@router.delete("/trees/{tree_id}", status_code=204)
def delete_fault_tree(tree_id: int, db: Session = Depends(get_db)):
    """Delete a fault tree"""
    tree = db.query(FaultTreeModel).filter(FaultTreeModel.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Fault tree not found")
    
    db.delete(tree)
    db.commit()
    return None
