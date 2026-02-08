"""
Core graph data structures and operations
"""
from typing import Dict, List, Optional, Any
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel, Field
import networkx as nx


class NodeData(BaseModel):
    """Base node data structure"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: str
    label: str
    domain: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EdgeData(BaseModel):
    """Base edge data structure"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    source: str
    target: str
    type: str
    weight: float = 1.0
    directed: bool = True
    attributes: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Graph:
    """Universal graph implementation using NetworkX"""
    
    def __init__(self, directed: bool = True):
        """Initialize graph
        
        Args:
            directed: Whether the graph is directed
        """
        self.graph = nx.DiGraph() if directed else nx.Graph()
        self.metadata: Dict[str, Any] = {}
    
    def add_node(self, node: NodeData) -> str:
        """Add a node to the graph
        
        Args:
            node: Node data
            
        Returns:
            Node ID
        """
        self.graph.add_node(
            node.id,
            **node.model_dump(exclude={'id'})
        )
        return node.id
    
    def add_edge(self, edge: EdgeData) -> str:
        """Add an edge to the graph
        
        Args:
            edge: Edge data
            
        Returns:
            Edge ID
        """
        self.graph.add_edge(
            edge.source,
            edge.target,
            **edge.model_dump(exclude={'source', 'target'})
        )
        return edge.id
    
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get node data
        
        Args:
            node_id: Node identifier
            
        Returns:
            Node data or None
        """
        if node_id not in self.graph.nodes:
            return None
        
        data = dict(self.graph.nodes[node_id])
        data['id'] = node_id
        return data
    
    def get_edge(self, source: str, target: str) -> Optional[Dict[str, Any]]:
        """Get edge data
        
        Args:
            source: Source node ID
            target: Target node ID
            
        Returns:
            Edge data or None
        """
        if not self.graph.has_edge(source, target):
            return None
        
        data = dict(self.graph.edges[source, target])
        data['source'] = source
        data['target'] = target
        return data
    
    def get_neighbors(self, node_id: str) -> List[str]:
        """Get neighboring nodes
        
        Args:
            node_id: Node identifier
            
        Returns:
            List of neighbor node IDs
        """
        if node_id not in self.graph.nodes:
            return []
        return list(self.graph.neighbors(node_id))
    
    def to_dict(self) -> Dict[str, Any]:
        """Export graph to dictionary
        
        Returns:
            Graph data as dictionary
        """
        return {
            'nodes': [
                {'id': node, **data}
                for node, data in self.graph.nodes(data=True)
            ],
            'edges': [
                {'source': u, 'target': v, **data}
                for u, v, data in self.graph.edges(data=True)
            ],
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Graph':
        """Create graph from dictionary
        
        Args:
            data: Graph data
            
        Returns:
            Graph instance
        """
        graph = cls()
        
        # Add nodes
        for node_data in data.get('nodes', []):
            node = NodeData(**node_data)
            graph.add_node(node)
        
        # Add edges
        for edge_data in data.get('edges', []):
            edge = EdgeData(**edge_data)
            graph.add_edge(edge)
        
        graph.metadata = data.get('metadata', {})
        return graph
