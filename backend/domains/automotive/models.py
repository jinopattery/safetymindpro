"""
Automotive FMEA domain models
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class FailureSeverity(str, Enum):
    """Failure severity ratings"""
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    CRITICAL = "critical"


class Component(BaseModel):
    """Automotive component"""
    id: str
    name: str
    type: str
    functions: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    parent_component: Optional[str] = None


class FailureMode(BaseModel):
    """Failure mode definition"""
    id: str
    component_id: str
    name: str
    description: str
    severity: int = Field(ge=1, le=10, description="Severity rating 1-10")
    occurrence: int = Field(ge=1, le=10, description="Occurrence rating 1-10")
    detection: int = Field(ge=1, le=10, description="Detection rating 1-10")
    rpn: int = Field(default=0, description="Risk Priority Number")
    effects: List[str] = Field(default_factory=list)
    causes: List[str] = Field(default_factory=list)
    controls: List[str] = Field(default_factory=list)
    
    def calculate_rpn(self) -> int:
        """Calculate Risk Priority Number
        
        Returns:
            RPN value
        """
        self.rpn = self.severity * self.occurrence * self.detection
        return self.rpn


class FunctionNet(BaseModel):
    """Functional relationship between components"""
    source_component: str
    target_component: str
    function_description: str
    interaction_type: str = "functional"


class FailureNet(BaseModel):
    """Failure propagation relationship"""
    source_failure: str
    target_component: str
    propagation_probability: float = Field(ge=0.0, le=1.0)
    propagation_mechanism: str
    time_to_propagate: Optional[float] = None  # in seconds


class FMEAAnalysis(BaseModel):
    """Complete FMEA analysis"""
    id: str
    name: str
    description: str
    components: List[Component]
    failure_modes: List[FailureMode]
    function_net: List[FunctionNet]
    failure_net: List[FailureNet]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def get_high_risk_failures(self, threshold: int = 100) -> List[FailureMode]:
        """Get failure modes with RPN above threshold
        
        Args:
            threshold: RPN threshold
            
        Returns:
            List of high-risk failure modes
        """
        return [fm for fm in self.failure_modes if fm.rpn >= threshold]
    
    def get_component_failures(self, component_id: str) -> List[FailureMode]:
        """Get all failure modes for a component
        
        Args:
            component_id: Component identifier
            
        Returns:
            List of failure modes
        """
        return [fm for fm in self.failure_modes if fm.component_id == component_id]