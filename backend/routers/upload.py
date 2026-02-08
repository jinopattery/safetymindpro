"""
File upload endpoints for FMEA data
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io
from backend.database import get_db
from backend.models import FMEAAnalysis as FMEAModel, FailureMode as FailureModeModel

router = APIRouter(prefix="/api/v1/upload", tags=["File Upload"])


@router.post("/fmea/excel")
async def upload_fmea_excel(
    file: UploadFile = File(...),
    analysis_name: str = "Imported FMEA",
    system: str = "Imported System",
    db: Session = Depends(get_db)
):
    """Upload FMEA data from Excel file
    
    Expected columns:
    - Component
    - Function
    - Failure Mode
    - Failure Effects
    - Failure Causes
    - Severity (1-10)
    - Occurrence (1-10)
    - Detection (1-10)
    - Current Controls (optional)
    - Recommended Actions (optional)
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Create FMEA analysis
        db_analysis = FMEAModel(
            name=analysis_name,
            system=system
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        # Process each row
        imported_count = 0
        for _, row in df.iterrows():
            try:
                rpn = int(row['Severity']) * int(row['Occurrence']) * int(row['Detection'])
                
                db_fm = FailureModeModel(
                    analysis_id=db_analysis.id,
                    component=str(row['Component']),
                    function=str(row['Function']),
                    failure_mode=str(row['Failure Mode']),
                    failure_effects=str(row['Failure Effects']),
                    failure_causes=str(row['Failure Causes']),
                    severity=int(row['Severity']),
                    occurrence=int(row['Occurrence']),
                    detection=int(row['Detection']),
                    rpn=rpn,
                    current_controls=str(row.get('Current Controls', '')),
                    recommended_actions=str(row.get('Recommended Actions', ''))
                )
                db.add(db_fm)
                imported_count += 1
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        db.commit()
        
        return {
            "message": "FMEA data imported successfully",
            "analysis_id": db_analysis.id,
            "imported_count": imported_count,
            "total_rows": len(df)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


@router.post("/fmea/csv")
async def upload_fmea_csv(
    file: UploadFile = File(...),
    analysis_name: str = "Imported FMEA",
    system: str = "Imported System",
    db: Session = Depends(get_db)
):
    """Upload FMEA data from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format (.csv)")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Create FMEA analysis
        db_analysis = FMEAModel(
            name=analysis_name,
            system=system
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        # Process each row
        imported_count = 0
        for _, row in df.iterrows():
            try:
                rpn = int(row['Severity']) * int(row['Occurrence']) * int(row['Detection'])
                
                db_fm = FailureModeModel(
                    analysis_id=db_analysis.id,
                    component=str(row['Component']),
                    function=str(row['Function']),
                    failure_mode=str(row['Failure Mode']),
                    failure_effects=str(row['Failure Effects']),
                    failure_causes=str(row['Failure Causes']),
                    severity=int(row['Severity']),
                    occurrence=int(row['Occurrence']),
                    detection=int(row['Detection']),
                    rpn=rpn,
                    current_controls=str(row.get('Current Controls', '')),
                    recommended_actions=str(row.get('Recommended Actions', ''))
                )
                db.add(db_fm)
                imported_count += 1
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        db.commit()
        
        return {
            "message": "FMEA data imported successfully",
            "analysis_id": db_analysis.id,
            "imported_count": imported_count,
            "total_rows": len(df)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
