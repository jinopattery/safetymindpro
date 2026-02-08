"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# FMEA Schemas
class FailureModeBase(BaseModel):
    component: str
    function: str
    failure_mode: str
    failure_effects: str
    failure_causes: str
    severity: int = Field(ge=1, le=10)
    occurrence: int = Field(ge=1, le=10)
    detection: int = Field(ge=1, le=10)
    current_controls: Optional[str] = None
    recommended_actions: Optional[str] = None
    responsibility: Optional[str] = None
    target_date: Optional[datetime] = None


class FailureModeCreate(FailureModeBase):
    pass


class FailureMode(FailureModeBase):
    id: int
    analysis_id: int
    rpn: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FMEAAnalysisBase(BaseModel):
    name: str
    description: Optional[str] = None
    system: str
    subsystem: Optional[str] = None


class FMEAAnalysisCreate(FMEAAnalysisBase):
    failure_modes: Optional[List[FailureModeCreate]] = []


class FMEAAnalysis(FMEAAnalysisBase):
    id: int
    created_at: datetime
    updated_at: datetime
    failure_modes: List[FailureMode] = []
    
    class Config:
        from_attributes = True


# Fault Tree Schemas
class FaultTreeNode(BaseModel):
    id: str
    type: str  # 'event', 'and', 'or', etc.
    label: str
    probability: Optional[float] = None


class FaultTreeEdge(BaseModel):
    source: str
    target: str


class FaultTreeBase(BaseModel):
    name: str
    description: Optional[str] = None
    top_event: str


class FaultTreeCreate(FaultTreeBase):
    nodes: List[FaultTreeNode] = []
    edges: List[FaultTreeEdge] = []


class FaultTree(FaultTreeBase):
    id: int
    nodes: List[FaultTreeNode]
    edges: List[FaultTreeEdge]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
