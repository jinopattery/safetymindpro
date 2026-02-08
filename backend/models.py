"""
Database models for SafetyMindPro
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class FMEAAnalysis(Base):
    """FMEA Analysis model"""
    __tablename__ = "fmea_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    system = Column(String, index=True)
    subsystem = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    failure_modes = relationship("FailureMode", back_populates="analysis", cascade="all, delete-orphan")


class FailureMode(Base):
    """Failure Mode model"""
    __tablename__ = "failure_modes"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("fmea_analyses.id"))
    
    # FMEA fields
    component = Column(String, index=True)
    function = Column(String)
    failure_mode = Column(String)
    failure_effects = Column(Text)
    failure_causes = Column(Text)
    
    # Risk assessment
    severity = Column(Integer)  # 1-10
    occurrence = Column(Integer)  # 1-10
    detection = Column(Integer)  # 1-10
    rpn = Column(Integer)  # Risk Priority Number (S * O * D)
    
    # Actions
    current_controls = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    responsibility = Column(String, nullable=True)
    target_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    analysis = relationship("FMEAAnalysis", back_populates="failure_modes")


class FaultTree(Base):
    """Fault Tree Analysis model"""
    __tablename__ = "fault_trees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    top_event = Column(String)
    
    # Graph data stored as JSON
    nodes = Column(JSON)  # List of nodes
    edges = Column(JSON)  # List of edges
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)