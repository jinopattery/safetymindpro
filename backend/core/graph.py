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
        self.graph_metadata: Dict[str, Any] = {}
    
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
            'graph_metadata': self.graph_metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Graph':
        """Create graph from dictionary
        
        Supports both the internal NodeData format and the React Flow node format
        (where label/domain/attributes are nested inside a 'data' sub-dict and
        type may be 'default' with the domain-specific type in data.nodeType).
        
        Args:
            data: Graph data
            
        Returns:
            Graph instance
        """
        graph = cls()
        
        # Add nodes - handle both NodeData format and React Flow format
        for node_data in data.get('nodes', []):
            node_id = node_data.get('id')
            if not node_id:
                continue
            
            # Build node attributes preserving all fields
            attrs = {k: v for k, v in node_data.items() if k != 'id'}
            
            # Promote fields from the nested React Flow 'data' sub-dict to top-level
            # so algorithms can find them with node_data.get('label'), .get('type'), etc.
            nested = attrs.get('data', {})
            if isinstance(nested, dict):
                # Promote domain-specific node type (React Flow uses 'default' as type)
                if nested.get('nodeType') and attrs.get('type') in (None, 'default'):
                    attrs['type'] = nested['nodeType']
                # Promote label if not already at top-level
                if nested.get('label') and 'label' not in attrs:
                    attrs['label'] = nested['label']
                # Promote domain if not already at top-level
                if nested.get('domain') and 'domain' not in attrs:
                    attrs['domain'] = nested['domain']
                # Promote attributes if not already at top-level (use 'in' to handle empty dicts)
                if 'attributes' in nested and 'attributes' not in attrs:
                    attrs['attributes'] = nested['attributes']
            
            graph.graph.add_node(node_id, **attrs)
        
        # Add edges - handle both EdgeData format and React Flow edge format
        for edge_data in data.get('edges', []):
            source = edge_data.get('source')
            target = edge_data.get('target')
            if not source or not target:
                continue
            try:
                edge = EdgeData(**edge_data)
                graph.add_edge(edge)
            except Exception:
                # Fallback: add edge directly for React Flow format with extra fields
                edge_attrs = {k: v for k, v in edge_data.items() if k not in ('source', 'target')}
                graph.graph.add_edge(source, target, **edge_attrs)
        
        graph.graph_metadata = data.get('graph_metadata', data.get('metadata', {}))  # Support old 'metadata' key for backward compatibility
        return graph
