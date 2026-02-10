"""
Base domain adapter interface for SafetyMindPro

This module defines the contract that all domain-specific modules must implement
to integrate with the universal graph-based analysis platform.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Type
from pydantic import BaseModel
from backend.core.graph import NodeData, EdgeData, Graph


class DomainNodeType(BaseModel):
    """Definition of a domain-specific node type"""
    name: str
    display_name: str
    icon: str
    description: Optional[str] = None
    default_attributes: Dict[str, Any] = {}


class DomainEdgeType(BaseModel):
    """Definition of a domain-specific edge type"""
    name: str
    display_name: str
    description: Optional[str] = None
    directed: bool = True
    default_attributes: Dict[str, Any] = {}


class DomainAlgorithm(ABC):
    """Base class for domain-specific algorithms"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Algorithm name"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Algorithm description"""
        pass
    
    @abstractmethod
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the algorithm on the graph
        
        Args:
            graph: Graph instance to analyze
            params: Optional algorithm parameters
            
        Returns:
            Dictionary containing algorithm results and updated node/edge attributes
        """
        pass


class StylingConfig(BaseModel):
    """Configuration for visual styling"""
    node_styles: Dict[str, Dict[str, Any]]
    edge_styles: Dict[str, Dict[str, Any]]
    theme: Dict[str, Any] = {}


class DomainAdapter(ABC):
    """
    Abstract base class for all domain adapters.
    
    Each domain (automotive, process plant, financial, etc.) must implement
    this interface to plug into the SafetyMindPro platform.
    """
    
    @property
    @abstractmethod
    def domain_name(self) -> str:
        """
        Unique identifier for this domain
        
        Returns:
            Domain name (e.g., 'automotive', 'process_plant', 'financial')
        """
        pass
    
    @property
    @abstractmethod
    def domain_display_name(self) -> str:
        """
        Human-readable domain name
        
        Returns:
            Display name (e.g., 'Automotive Safety', 'Process Plant')
        """
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """
        Description of what this domain adapter does
        
        Returns:
            Domain description
        """
        pass
    
    @abstractmethod
    def get_node_types(self) -> List[DomainNodeType]:
        """
        Get all node types supported by this domain
        
        Returns:
            List of node type definitions
        """
        pass
    
    @abstractmethod
    def get_edge_types(self) -> List[DomainEdgeType]:
        """
        Get all edge types supported by this domain
        
        Returns:
            List of edge type definitions
        """
        pass
    
    @abstractmethod
    def get_styling_config(self) -> StylingConfig:
        """
        Get visual styling configuration for this domain
        
        Returns:
            Styling configuration including node/edge styles and theme
        """
        pass
    
    @abstractmethod
    def get_algorithms(self) -> List[DomainAlgorithm]:
        """
        Get domain-specific analysis algorithms
        
        Returns:
            List of algorithm instances
        """
        pass
    
    @abstractmethod
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """
        Validate that a node conforms to domain rules
        
        Args:
            node_data: Node data to validate
            
        Returns:
            True if valid, False otherwise
        """
        pass
    
    @abstractmethod
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """
        Validate that an edge conforms to domain rules
        
        Args:
            edge_data: Edge data to validate
            
        Returns:
            True if valid, False otherwise
        """
        pass
    
    def enrich_node(self, node: NodeData) -> NodeData:
        """
        Optionally enrich a node with domain-specific computed attributes
        
        Args:
            node: Node to enrich
            
        Returns:
            Enriched node
        """
        return node
    
    def enrich_edge(self, edge: EdgeData) -> EdgeData:
        """
        Optionally enrich an edge with domain-specific computed attributes
        
        Args:
            edge: Edge to enrich
            
        Returns:
            Enriched edge
        """
        return edge
    
    def get_default_graph_config(self) -> Dict[str, Any]:
        """
        Get default graph configuration for this domain
        
        Returns:
            Configuration dictionary
        """
        return {
            "directed": True,
            "allow_self_loops": False,
            "allow_parallel_edges": False
        }
    
    def get_export_formats(self) -> List[str]:
        """
        Get supported export formats for this domain
        
        Returns:
            List of format names (e.g., ['excel', 'pdf', 'json'])
        """
        return ['json', 'graphml']
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for domain data validation
        
        Returns:
            JSON schema dictionary
        """
        return {
            "domain": self.domain_name,
            "node_types": [nt.dict() for nt in self.get_node_types()],
            "edge_types": [et.dict() for et in self.get_edge_types()]
        }
