"""
Export endpoints for FMEA data
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from backend.database import get_db
from backend.models import FMEAAnalysis as FMEAModel

router = APIRouter(prefix="/api/v1/fmea/analyses", tags=["Export"])


@router.get("/{analysis_id}/export/excel")
def export_to_excel(analysis_id: int, db: Session = Depends(get_db)):
    """Export FMEA analysis to Excel file"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    
    # Prepare data for Excel
    data = []
    for fm in analysis.failure_modes:
        data.append({
            'Component': fm.component,
            'Function': fm.function,
            'Failure Mode': fm.failure_mode,
            'Failure Effects': fm.failure_effects,
            'Failure Causes': fm.failure_causes,
            'Severity': fm.severity,
            'Occurrence': fm.occurrence,
            'Detection': fm.detection,
            'RPN': fm.rpn,
            'Current Controls': fm.current_controls or '',
            'Recommended Actions': fm.recommended_actions or '',
            'Responsibility': fm.responsibility or '',
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='FMEA', index=False)
        
        # Add analysis info sheet
        info_df = pd.DataFrame({
            'Property': ['Name', 'System', 'Subsystem', 'Description', 'Created'],
            'Value': [
                analysis.name,
                analysis.system,
                analysis.subsystem or '',
                analysis.description or '',
                str(analysis.created_at)
            ]
        })
        info_df.to_excel(writer, sheet_name='Analysis Info', index=False)
    
    output.seek(0)
    
    filename = f"FMEA_{analysis.name.replace(' ', '_')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename} "}
    )


@router.get("/{analysis_id}/export/csv")
def export_to_csv(analysis_id: int, db: Session = Depends(get_db)):
    """Export FMEA analysis to CSV file"""
    analysis = db.query(FMEAModel).filter(FMEAModel.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="FMEA analysis not found")
    
    # Prepare data for CSV
    data = []
    for fm in analysis.failure_modes:
        data.append({
            'Component': fm.component,
            'Function': fm.function,
            'Failure Mode': fm.failure_mode,
            'Failure Effects': fm.failure_effects,
            'Failure Causes': fm.failure_causes,
            'Severity': fm.severity,
            'Occurrence': fm.occurrence,
            'Detection': fm.detection,
            'RPN': fm.rpn,
            'Current Controls': fm.current_controls or '',
            'Recommended Actions': fm.recommended_actions or '',
        })
    
    df = pd.DataFrame(data)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    filename = f"FMEA_{analysis.name.replace(' ', '_')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename} "}
    )
