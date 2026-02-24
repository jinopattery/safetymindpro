"""
Finance domain models

This module defines the data models for finance risk analysis (FMEA-style).

Domain mapping:
- Form layer  → Share Deposits (portfolios, depos, share accounts)
- Function layer → Investment functions (long-term gain, short-term gain, dividends, etc.)
- Failure layer → Financial losses (long-term loss, short-term loss, capital loss, etc.)

Import Management:
- Imports calculate_rpn from utils.py (not calculations.py) to avoid circular imports
- The utils module acts as a shared utility layer between models and calculations
- This allows LossMode.calculate_rpn() to use the utility without circular dependency
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

# Import shared utility to avoid circular import with calculations module
from backend.domains.finance.utils import calculate_rpn


class LossSeverity(str, Enum):
    """Loss severity ratings"""
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    CRITICAL = "critical"


class ShareDeposit(BaseModel):
    """Share deposit / portfolio component (Form layer)

    Represents a holding vehicle such as a brokerage account, fund, or
    custodian depot that holds shares and other securities.
    """
    id: str
    name: str
    type: str  # e.g. brokerage_account, fund, depot
    investment_functions: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    parent_component: Optional[str] = None


class LossMode(BaseModel):
    """Financial loss mode definition (Failure layer)

    Captures potential losses such as long-term capital loss, short-term
    trading loss, dividend loss, liquidity shortfall, etc.
    """
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
        self.rpn = calculate_rpn(self.severity, self.occurrence, self.detection)
        return self.rpn


class GainNet(BaseModel):
    """Functional relationship between share deposits (Function flow)"""
    source_component: str
    target_component: str
    gain_description: str  # e.g. "long-term gain flow", "dividend yield"
    interaction_type: str = "functional"


class LossNet(BaseModel):
    """Loss propagation relationship (Failure propagation)"""
    source_loss: str
    target_component: str
    propagation_probability: float = Field(ge=0.0, le=1.0)
    propagation_mechanism: str  # e.g. "market contagion", "liquidity cascade"
    time_to_propagate: Optional[float] = None  # in seconds


class FinanceAnalysis(BaseModel):
    """Complete finance risk analysis"""
    id: str
    name: str
    description: str
    components: List[ShareDeposit]
    risk_modes: List[LossMode]
    gain_net: List[GainNet]
    loss_net: List[LossNet]
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def get_high_risk_modes(self, threshold: int = 100) -> List[LossMode]:
        """Get loss modes with RPN above threshold

        Args:
            threshold: RPN threshold

        Returns:
            List of high-risk loss modes
        """
        return [rm for rm in self.risk_modes if rm.rpn >= threshold]

    def get_component_risks(self, component_id: str) -> List[LossMode]:
        """Get all loss modes for a share deposit

        Args:
            component_id: Share deposit identifier

        Returns:
            List of loss modes
        """
        return [rm for rm in self.risk_modes if rm.component_id == component_id]
