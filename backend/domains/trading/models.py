"""
Trading Domain Models

Data models for stock trading, portfolio analysis, and market network analysis.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from decimal import Decimal


class AssetType(str, Enum):
    """Types of tradable assets"""
    STOCK = "stock"
    BOND = "bond"
    ETF = "etf"
    OPTION = "option"
    FUTURE = "future"
    CRYPTO = "crypto"
    COMMODITY = "commodity"
    FOREX = "forex"


class OrderType(str, Enum):
    """Types of trading orders"""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class PositionType(str, Enum):
    """Position types"""
    LONG = "long"
    SHORT = "short"


class CorrelationType(str, Enum):
    """Types of correlations between assets"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class RiskCategory(str, Enum):
    """Risk categories"""
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    SPECULATIVE = "speculative"


class Asset(BaseModel):
    """Financial asset/security"""
    id: str
    symbol: str
    name: str
    asset_type: AssetType
    
    # Current data
    current_price: Decimal
    previous_close: Decimal
    volume: int = 0
    market_cap: Optional[Decimal] = None
    
    # Fundamentals
    sector: Optional[str] = None
    industry: Optional[str] = None
    exchange: Optional[str] = None
    
    # Risk metrics
    beta: float = 1.0  # Market sensitivity
    volatility: float = 0.0  # Annualized volatility
    sharpe_ratio: Optional[float] = None
    
    # Technical indicators
    rsi: Optional[float] = None  # Relative Strength Index
    macd: Optional[float] = None
    moving_avg_50: Optional[Decimal] = None
    moving_avg_200: Optional[Decimal] = None


class Position(BaseModel):
    """Trading position"""
    id: str
    asset_symbol: str
    position_type: PositionType
    
    # Quantity
    shares: Decimal
    entry_price: Decimal
    current_price: Decimal
    
    # Dates
    opened_at: datetime
    closed_at: Optional[datetime] = None
    
    # P&L
    unrealized_pnl: Decimal = Decimal("0")
    realized_pnl: Optional[Decimal] = None
    
    # Risk management
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    
    # Margin (for short positions or leverage)
    is_margin: bool = False
    margin_requirement: Optional[Decimal] = None


class Trade(BaseModel):
    """Individual trade execution"""
    id: str
    asset_symbol: str
    order_type: OrderType
    
    # Trade details
    action: str  # buy, sell
    quantity: Decimal
    price: Decimal
    total_value: Decimal
    
    # Timing
    timestamp: datetime
    execution_time: Optional[float] = None  # milliseconds
    
    # Fees
    commission: Decimal = Decimal("0")
    fees: Decimal = Decimal("0")
    
    # Order info
    order_id: str
    account_id: str
    
    # Status
    status: str = "filled"  # pending, filled, partial, canceled


class Portfolio(BaseModel):
    """Investment portfolio"""
    id: str
    name: str
    owner_id: str
    
    # Value
    total_value: Decimal
    cash_balance: Decimal
    invested_value: Decimal
    
    # Performance
    total_return: Decimal = Decimal("0")
    total_return_pct: float = 0.0
    day_change: Decimal = Decimal("0")
    day_change_pct: float = 0.0
    
    # Risk
    risk_category: RiskCategory = RiskCategory.MODERATE
    portfolio_beta: float = 1.0
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    
    # Holdings
    positions: List[str] = Field(default_factory=list)  # Position IDs
    
    # Allocation
    sector_allocation: Dict[str, float] = Field(default_factory=dict)
    asset_allocation: Dict[str, float] = Field(default_factory=dict)


class Correlation(BaseModel):
    """Correlation between two assets"""
    asset1: str
    asset2: str
    correlation_coefficient: float = Field(ge=-1.0, le=1.0)
    correlation_type: CorrelationType
    
    # Statistical info
    sample_size: int
    p_value: Optional[float] = None
    
    # Time period
    start_date: datetime
    end_date: datetime


class DependencyRisk(BaseModel):
    """Risk from asset dependencies"""
    id: str
    source_asset: str
    dependent_assets: List[str]
    
    # Risk metrics
    contagion_risk: float = Field(ge=0.0, le=100.0)
    correlation_strength: float
    
    # Impact analysis
    potential_impact: str  # low, medium, high, critical
    affected_portfolios: List[str] = Field(default_factory=list)


class MarketEvent(BaseModel):
    """Significant market event"""
    id: str
    event_type: str  # earnings, merger, regulatory, economic, etc.
    severity: int = Field(ge=1, le=10)
    
    # Timing
    occurred_at: datetime
    detected_at: datetime
    
    # Impact
    affected_assets: List[str]
    market_impact: str  # positive, negative, neutral
    price_impact_pct: Optional[float] = None
    
    # Details
    description: str
    source: Optional[str] = None


class TradingNetwork(BaseModel):
    """Complete trading network analysis"""
    id: str
    name: str
    description: str
    
    assets: List[Asset]
    positions: List[Position]
    trades: List[Trade]
    portfolios: List[Portfolio]
    correlations: List[Correlation]
    dependency_risks: List[DependencyRisk] = Field(default_factory=list)
    market_events: List[MarketEvent] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def get_portfolio_by_id(self, portfolio_id: str) -> Optional[Portfolio]:
        """Get portfolio by ID"""
        for p in self.portfolios:
            if p.id == portfolio_id:
                return p
        return None
    
    def get_positions_by_portfolio(self, portfolio_id: str) -> List[Position]:
        """Get all positions in a portfolio"""
        portfolio = self.get_portfolio_by_id(portfolio_id)
        if not portfolio:
            return []
        
        return [p for p in self.positions if p.id in portfolio.positions]
    
    def get_highly_correlated_pairs(self, threshold: float = 0.7) -> List[Correlation]:
        """Get asset pairs with high correlation"""
        return [
            c for c in self.correlations 
            if abs(c.correlation_coefficient) >= threshold
        ]
    
    def calculate_total_exposure(self) -> Decimal:
        """Calculate total market exposure"""
        return sum(p.total_value for p in self.portfolios)
    
    def get_high_risk_dependencies(self, threshold: float = 60.0) -> List[DependencyRisk]:
        """Get dependencies with high contagion risk"""
        return [d for d in self.dependency_risks if d.contagion_risk >= threshold]
