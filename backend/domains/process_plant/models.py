"""
Process Plant Domain Models

Data models for process plant equipment, flows, and anomaly detection.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class EquipmentType(str, Enum):
    """Types of process equipment"""
    TANK = "tank"
    PUMP = "pump"
    HEAT_EXCHANGER = "heat_exchanger"
    REACTOR = "reactor"
    COMPRESSOR = "compressor"
    VALVE = "valve"
    SENSOR = "sensor"
    CONTROL_SYSTEM = "control_system"
    SEPARATOR = "separator"
    COLUMN = "column"


class FlowType(str, Enum):
    """Types of process flows"""
    MASS_FLOW = "mass_flow"
    TEMPERATURE_FLOW = "temperature_flow"
    PRESSURE_FLOW = "pressure_flow"
    CONTROL_SIGNAL = "control_signal"
    ENERGY_FLOW = "energy_flow"


class AnomalyType(str, Enum):
    """Types of anomalies"""
    HIGH_TEMPERATURE = "high_temperature"
    LOW_TEMPERATURE = "low_temperature"
    HIGH_PRESSURE = "high_pressure"
    LOW_PRESSURE = "low_pressure"
    FLOW_DEVIATION = "flow_deviation"
    VIBRATION = "vibration"
    LEAK = "leak"
    BLOCKAGE = "blockage"
    SENSOR_FAULT = "sensor_fault"


class Equipment(BaseModel):
    """Process equipment model"""
    id: str
    name: str
    equipment_type: EquipmentType
    description: Optional[str] = None
    
    # Operating parameters
    temperature: Optional[float] = None  # °C
    pressure: Optional[float] = None  # bar
    capacity: Optional[float] = None  # depends on equipment type
    flow_rate: Optional[float] = None  # kg/hr
    
    # Design parameters
    design_temperature_max: Optional[float] = None
    design_pressure_max: Optional[float] = None
    
    # Status
    operational_status: str = "normal"  # normal, warning, critical, shutdown
    last_maintenance: Optional[datetime] = None
    
    # Location
    area: Optional[str] = None
    unit: Optional[str] = None


class ProcessFlow(BaseModel):
    """Process flow between equipment"""
    id: str
    from_equipment: str
    to_equipment: str
    flow_type: FlowType
    
    # Flow parameters
    flow_rate: Optional[float] = None  # kg/hr
    temperature: Optional[float] = None  # °C
    pressure: Optional[float] = None  # bar
    substance: Optional[str] = None
    composition: Optional[Dict[str, float]] = None  # Component percentages
    
    # Control
    is_controlled: bool = False
    controller_id: Optional[str] = None
    setpoint: Optional[float] = None


class Sensor(BaseModel):
    """Sensor/measurement point"""
    id: str
    name: str
    equipment_id: str
    sensor_type: str  # temperature, pressure, flow, level, etc.
    
    # Current reading
    current_value: Optional[float] = None
    unit: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    # Thresholds
    min_normal: Optional[float] = None
    max_normal: Optional[float] = None
    min_critical: Optional[float] = None
    max_critical: Optional[float] = None
    
    # Status
    status: str = "normal"  # normal, warning, critical, fault
    is_calibrated: bool = True


class Anomaly(BaseModel):
    """Detected anomaly"""
    id: str
    equipment_id: str
    anomaly_type: AnomalyType
    severity: int = Field(ge=1, le=10, description="Severity 1-10")
    
    # Detection
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    detected_value: Optional[float] = None
    expected_value: Optional[float] = None
    deviation_percent: Optional[float] = None
    
    # Impact
    affected_equipment: List[str] = Field(default_factory=list)
    production_impact: Optional[str] = None  # none, minor, moderate, severe
    safety_impact: Optional[str] = None  # none, minor, moderate, severe
    
    # Response
    response_required: bool = True
    recommended_action: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None


class ProcessUnit(BaseModel):
    """Complete process unit analysis"""
    id: str
    name: str
    description: str
    
    equipment: List[Equipment]
    flows: List[ProcessFlow]
    sensors: List[Sensor]
    anomalies: List[Anomaly] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def get_critical_anomalies(self, threshold: int = 7) -> List[Anomaly]:
        """Get anomalies above severity threshold"""
        return [a for a in self.anomalies if a.severity >= threshold and not a.resolved]
    
    def get_equipment_by_type(self, equipment_type: EquipmentType) -> List[Equipment]:
        """Get all equipment of a specific type"""
        return [e for e in self.equipment if e.equipment_type == equipment_type]
    
    def get_flows_from_equipment(self, equipment_id: str) -> List[ProcessFlow]:
        """Get all flows originating from an equipment"""
        return [f for f in self.flows if f.from_equipment == equipment_id]
    
    def get_flows_to_equipment(self, equipment_id: str) -> List[ProcessFlow]:
        """Get all flows going to an equipment"""
        return [f for f in self.flows if f.to_equipment == equipment_id]
