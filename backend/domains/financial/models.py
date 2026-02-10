"""
Financial Domain Models

Data models for banking, fraud detection, and transaction analysis.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from decimal import Decimal


class AccountType(str, Enum):
    """Types of financial accounts"""
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    LOAN = "loan"
    INVESTMENT = "investment"
    BUSINESS = "business"
    MERCHANT = "merchant"


class TransactionType(str, Enum):
    """Types of transactions"""
    TRANSFER = "transfer"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"
    PAYMENT = "payment"
    PURCHASE = "purchase"
    REFUND = "refund"
    FEE = "fee"


class RiskLevel(str, Enum):
    """Risk assessment levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudIndicator(str, Enum):
    """Types of fraud indicators"""
    VELOCITY_ANOMALY = "velocity_anomaly"
    AMOUNT_ANOMALY = "amount_anomaly"
    GEOGRAPHIC_ANOMALY = "geographic_anomaly"
    PATTERN_BREAK = "pattern_break"
    SUSPICIOUS_TIMING = "suspicious_timing"
    UNUSUAL_NETWORK = "unusual_network"
    BLACKLIST_MATCH = "blacklist_match"


class Account(BaseModel):
    """Financial account model"""
    id: str
    account_number: str
    account_type: AccountType
    holder_name: str
    
    # Balance info
    balance: Decimal = Decimal("0.00")
    currency: str = "USD"
    
    # Status
    status: str = "active"  # active, suspended, closed, frozen
    opened_date: datetime
    last_activity: Optional[datetime] = None
    
    # Risk profile
    risk_score: float = 0.0  # 0-100
    fraud_flags: List[str] = Field(default_factory=list)
    
    # Metadata
    customer_id: Optional[str] = None
    branch_id: Optional[str] = None
    country: Optional[str] = None
    kyc_verified: bool = False


class Transaction(BaseModel):
    """Financial transaction model"""
    id: str
    from_account: str
    to_account: str
    transaction_type: TransactionType
    
    # Amount info
    amount: Decimal
    currency: str = "USD"
    exchange_rate: Optional[Decimal] = None
    
    # Timing
    timestamp: datetime
    processing_time: Optional[float] = None  # seconds
    
    # Details
    description: Optional[str] = None
    merchant_id: Optional[str] = None
    merchant_category: Optional[str] = None
    
    # Location
    location: Optional[str] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    
    # Status
    status: str = "completed"  # pending, completed, failed, reversed
    
    # Risk assessment
    risk_score: float = 0.0
    fraud_indicators: List[FraudIndicator] = Field(default_factory=list)
    is_flagged: bool = False


class Entity(BaseModel):
    """Financial entity (person or organization)"""
    id: str
    name: str
    entity_type: str  # individual, business, institution
    
    # Identification
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    
    # Contact
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Risk profile
    risk_level: RiskLevel = RiskLevel.LOW
    sanctions_list: bool = False
    pep: bool = False  # Politically Exposed Person
    
    # Relationships
    accounts: List[str] = Field(default_factory=list)
    related_entities: List[str] = Field(default_factory=list)


class FraudCase(BaseModel):
    """Detected fraud case"""
    id: str
    case_type: str  # identity_theft, account_takeover, money_laundering, etc.
    severity: int = Field(ge=1, le=10)
    
    # Detection
    detected_at: datetime
    detection_method: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    
    # Involved parties
    primary_account: str
    involved_accounts: List[str] = Field(default_factory=list)
    involved_transactions: List[str] = Field(default_factory=list)
    
    # Evidence
    fraud_indicators: List[FraudIndicator]
    evidence_details: Dict[str, Any] = Field(default_factory=dict)
    
    # Response
    status: str = "open"  # open, investigating, confirmed, false_positive, resolved
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    
    # Financial impact
    potential_loss: Optional[Decimal] = None
    actual_loss: Optional[Decimal] = None
    recovered_amount: Optional[Decimal] = None


class MoneyLaunderingAlert(BaseModel):
    """Anti-Money Laundering (AML) alert"""
    id: str
    alert_type: str  # structuring, rapid_movement, layering, etc.
    priority: str = "medium"  # low, medium, high, urgent
    
    # Detection
    detected_at: datetime
    time_period: tuple[datetime, datetime]
    
    # Pattern
    pattern_description: str
    total_amount: Decimal
    transaction_count: int
    
    # Involved parties
    primary_entity: str
    involved_accounts: List[str]
    involved_entities: List[str] = Field(default_factory=list)
    
    # Analysis
    suspicion_score: float = Field(ge=0.0, le=100.0)
    indicators: List[str] = Field(default_factory=list)
    
    # Status
    status: str = "pending_review"
    sar_filed: bool = False  # Suspicious Activity Report
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None


class FinancialNetwork(BaseModel):
    """Complete financial network analysis"""
    id: str
    name: str
    description: str
    
    accounts: List[Account]
    transactions: List[Transaction]
    entities: List[Entity]
    fraud_cases: List[FraudCase] = Field(default_factory=list)
    aml_alerts: List[MoneyLaunderingAlert] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def get_high_risk_accounts(self, threshold: float = 70.0) -> List[Account]:
        """Get accounts with risk score above threshold"""
        return [a for a in self.accounts if a.risk_score >= threshold]
    
    def get_active_fraud_cases(self) -> List[FraudCase]:
        """Get all active fraud cases"""
        return [f for f in self.fraud_cases if f.status in ["open", "investigating"]]
    
    def get_transactions_by_account(self, account_id: str) -> List[Transaction]:
        """Get all transactions for an account"""
        return [
            t for t in self.transactions 
            if t.from_account == account_id or t.to_account == account_id
        ]
    
    def calculate_total_exposure(self) -> Decimal:
        """Calculate total potential fraud exposure"""
        return sum(
            (case.potential_loss or Decimal("0"))
            for case in self.fraud_cases
            if case.status in ["open", "investigating", "confirmed"]
        )
