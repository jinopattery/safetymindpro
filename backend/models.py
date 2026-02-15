"""
Database Models with User Management
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    projects = relationship("Project", back_populates="owner")
    graphs = relationship("Graph", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    domain = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    graphs = relationship("Graph", back_populates="project")

class Graph(Base):
    __tablename__ = "graphs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    graph_data = Column(JSON)
    project_id = Column(Integer, ForeignKey("projects.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="graphs")
    owner = relationship("User", back_populates="graphs")
    analysis_results = relationship("AnalysisResult", back_populates="graph")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("graphs.id"))
    algorithm_name = Column(String, nullable=False)
    results = Column(JSON)
    parameters = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    graph = relationship("Graph", back_populates="analysis_results")


class UniversalGraphData(Base):
    """
    Storage for universal graph data using Form-Function-Failure architecture
    """
    __tablename__ = "universal_graphs"
    
    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("graphs.id"), nullable=True)
    domain = Column(String, nullable=False)
    
    # Form-Function-Failure data as JSON
    form_elements = Column(JSON)  # Dict of FormElement instances
    functions = Column(JSON)  # Dict of Function instances
    failure_modes = Column(JSON)  # Dict of FailureMode instances
    function_branches = Column(JSON)  # List of FunctionBranch instances
    failure_branches = Column(JSON)  # List of FailurePropagationBranch instances
    metadata = Column(JSON)  # Additional metadata
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
