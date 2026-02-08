"""
FMEA API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import FMEAAnalysis as FMEAModel, FailureMode as FailureModeModel
from backend.schemas import FMEAAnalysis, FMEAAnalysisCreate, FailureMode, FailureModeCreate

router = APIRouter(prefix="/api/v1/fmea", tags=["FMEA"])


@router.post("/analyses", response_model=FMEAAnalysis, status_code=201)
def create_fmea_analysis(analysis: FMEAAnalysisCreate, db: Session = Depends(get_db)):
    """Create a new FMEA analysis"""
    db_analysis = FMEAModel(
        name=analysis.name,
        description=analysis.description,
        system=analysis.system,
        subsystem=analysis.subsystem
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    # Add failure modes
    for fm in analysis.failure_modes:
        rpn = fm.severity * fm.occurrence * fm.detection
        db_fm = FailureModeModel(
            analysis_id=db_analysis.id,
            rpn=rpn,
            **fm.model_dump()
        )
        db.add(db_fm)
    
    db.commit()
    db.refresh(db_analysis)
    return db_analysis


@router.get("/analyses", response_model=List[FMEAAnalysis])
def list_fmea_analyses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all FMEA analyses"""
    analyses = db.query(FMEAModel).offset(skip).limit(limit).all()
    return analyses


@router.get("/analyses/{analysis_id}", response_model=FMEAAnalysis)
def get_fmea_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get a specific FMEA analysis"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    return analysis


@router.post("/analyses/{analysis_id}/failure-modes", response_model=FailureMode, status_code=201)
def add_failure_mode(analysis_id: int, failure_mode: FailureModeCreate, db: Session = Depends(get_db)):
    """Add a failure mode to an analysis"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    
    rpn = failure_mode.severity * failure_mode.occurrence * failure_mode.detection
    db_fm = FailureModeModel(
        analysis_id=analysis_id,
        rpn=rpn,
        **failure_mode.model_dump()
    )
    db.add(db_fm)
    db.commit()
    db.refresh(db_fm)
    return db_fm


@router.get("/analyses/{analysis_id}/risk-summary")
def get_risk_summary(analysis_id: int, db: Session = Depends(get_db)):
    """Get risk summary for an FMEA analysis"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    
    failure_modes = analysis.failure_modes
    
    if not failure_modes:
        return {
            "total_failure_modes": 0,
            "average_rpn": 0,
            "max_rpn": 0,
            "high_risk_count": 0
        }
    
    rpns = [fm.rpn for fm in failure_modes]
    
    return {
        "total_failure_modes": len(failure_modes),
        "average_rpn": sum(rpns) / len(rpns),
        "max_rpn": max(rpns),
        "high_risk_count": len([rpn for rpn in rpns if rpn >= 100])
    }


@router.delete("/analyses/{analysis_id}", status_code=204)
def delete_fmea_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Delete an FMEA analysis"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    
    db.delete(analysis)
    db.commit()
    return None
