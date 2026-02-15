"""
Automotive Domain Adapter

Implements the DomainAdapter interface for automotive safety analysis (FMEA, FTA).
"""

from typing import Dict, List, Any, Optional
from backend.domains.base import (
    DomainAdapter, DomainNodeType, DomainEdgeType, 
    DomainAlgorithm, StylingConfig
)
from backend.core.graph import NodeData, EdgeData, Graph
from backend.domains.automotive.models import FailureMode, Component, FunctionNet, FailureNet
# Import shared utilities to avoid circular imports
from backend.domains.automotive.utils import calculate_rpn
import networkx as nx


class FMEARiskAnalysis(DomainAlgorithm):
    """FMEA risk analysis algorithm"""
    
    @property
    def name(self) -> str:
        return "fmea_risk_analysis"
    
    @property
    def description(self) -> str:
        return "Calculates RPN and identifies high-risk failure modes"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run FMEA risk analysis"""
        threshold = params.get('rpn_threshold', 100) if params else 100
        high_risk_nodes = []
        
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'failure_mode':
                attrs = node_data.get('attributes', {})
                severity = attrs.get('severity', 1)
                occurrence = attrs.get('occurrence', 1)
                detection = attrs.get('detection', 1)
                rpn = severity * occurrence * detection
                
                # Update node with RPN
                graph.graph.nodes[node_id]['attributes']['rpn'] = rpn
                graph.graph.nodes[node_id]['attributes']['risk_level'] = (
                    'critical' if rpn >= 200 else
                    'high' if rpn >= threshold else
                    'medium' if rpn >= 50 else
                    'low'
                )
                
                if rpn >= threshold:
                    high_risk_nodes.append({
                        'node_id': node_id,
                        'rpn': rpn,
                        'component': attrs.get('component', 'unknown'),
                        'failure_mode': node_data.get('label', 'unknown')
                    })
        
        return {
            'high_risk_failures': sorted(high_risk_nodes, key=lambda x: x['rpn'], reverse=True),
            'total_analyzed': len([n for n, d in graph.graph.nodes(data=True) if d.get('type') == 'failure_mode']),
            'threshold': threshold
        }


class FailurePropagationAnalysis(DomainAlgorithm):
    """Analyzes failure propagation paths"""
    
    @property
    def name(self) -> str:
        return "failure_propagation"
    
    @property
    def description(self) -> str:
        return "Traces failure propagation paths through the system"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Trace failure propagation"""
        max_depth = params.get('max_depth', 5) if params else 5
        
        propagation_paths = []
        failure_nodes = [
            n for n, d in graph.graph.nodes(data=True) 
            if d.get('type') == 'failure_mode'
        ]
        
        for failure_node in failure_nodes:
            try:
                # Find all paths from this failure
                reachable = nx.single_source_shortest_path_length(
                    graph.graph, failure_node, cutoff=max_depth
                )
                
                if len(reachable) > 1:  # More than just the source
                    propagation_paths.append({
                        'source': failure_node,
                        'affected_nodes': len(reachable) - 1,
                        'reachable': list(reachable.keys())
                    })
                    
                    # Mark propagation depth on nodes
                    for target, depth in reachable.items():
                        if target != failure_node:
                            if 'propagation_sources' not in graph.graph.nodes[target].get('attributes', {}):
                                graph.graph.nodes[target]['attributes']['propagation_sources'] = []
                            graph.graph.nodes[target]['attributes']['propagation_sources'].append({
                                'source': failure_node,
                                'depth': depth
                            })
            except:
                pass
        
        return {
            'propagation_paths': propagation_paths,
            'most_critical': max(propagation_paths, key=lambda x: x['affected_nodes']) if propagation_paths else None
        }


class CriticalComponentAnalysis(DomainAlgorithm):
    """Identifies critical components using centrality measures"""
    
    @property
    def name(self) -> str:
        return "critical_components"
    
    @property
    def description(self) -> str:
        return "Identifies critical components based on network centrality"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Identify critical components"""
        top_n = params.get('top_n', 5) if params else 5
        
        # Calculate betweenness centrality
        centrality = nx.betweenness_centrality(graph.graph)
        
        # Update nodes with centrality scores
        for node_id, score in centrality.items():
            graph.graph.nodes[node_id]['attributes']['centrality_score'] = score
            graph.graph.nodes[node_id]['attributes']['is_critical'] = score > 0.1
        
        # Get top critical nodes
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        critical_components = []
        for node_id, score in sorted_nodes:
            node_data = graph.graph.nodes[node_id]
            critical_components.append({
                'node_id': node_id,
                'component': node_data.get('label', 'unknown'),
                'centrality_score': score,
                'type': node_data.get('type', 'unknown')
            })
        
        return {
            'critical_components': critical_components,
            'average_centrality': sum(centrality.values()) / len(centrality) if centrality else 0
        }


class AutomotiveDomain(DomainAdapter):
    """
    Automotive safety analysis domain adapter.
    
    Supports FMEA, FTA, and component analysis for automotive systems.
    """
    
    @property
    def domain_name(self) -> str:
        return "automotive"
    
    @property
    def domain_display_name(self) -> str:
        return "Automotive Safety"
    
    @property
    def description(self) -> str:
        return "FMEA and FTA analysis for automotive systems including component modeling, failure modes, and risk assessment"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            DomainNodeType(
                name="component",
                display_name="Component",
                icon="🔧",
                description="Automotive component or subsystem",
                default_attributes={
                    "functions": [],
                    "parent_component": None
                }
            ),
            DomainNodeType(
                name="failure_mode",
                display_name="Failure Mode",
                icon="⚠️",
                description="Potential failure mode of a component",
                default_attributes={
                    "severity": 1,
                    "occurrence": 1,
                    "detection": 1,
                    "rpn": 0,
                    "effects": [],
                    "causes": [],
                    "controls": []
                }
            ),
            DomainNodeType(
                name="fault_event",
                display_name="Fault Event",
                icon="🔴",
                description="Event in fault tree analysis",
                default_attributes={
                    "probability": 0.0,
                    "gate_type": None  # AND, OR, etc.
                }
            ),
            DomainNodeType(
                name="system",
                display_name="System",
                icon="🚗",
                description="Top-level automotive system",
                default_attributes={
                    "subsystems": []
                }
            )
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            DomainEdgeType(
                name="function_flow",
                display_name="Function Flow",
                description="Functional relationship between components",
                directed=True,
                default_attributes={
                    "function_description": ""
                }
            ),
            DomainEdgeType(
                name="failure_propagation",
                display_name="Failure Propagation",
                description="How a failure propagates from one component to another",
                directed=True,
                default_attributes={
                    "propagation_probability": 1.0,
                    "propagation_mechanism": "",
                    "time_to_propagate": None
                }
            ),
            DomainEdgeType(
                name="component_hierarchy",
                display_name="Component Hierarchy",
                description="Parent-child relationship between components",
                directed=True,
                default_attributes={
                    "relationship_type": "contains"
                }
            ),
            DomainEdgeType(
                name="fault_tree_gate",
                display_name="Fault Tree Gate",
                description="Logical gate connection in fault tree",
                directed=True,
                default_attributes={
                    "gate_type": "AND"  # AND, OR, etc.
                }
            )
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                "component": {
                    "shape": "rectangle",
                    "backgroundColor": "#3498db",
                    "color": "#ffffff",
                    "borderColor": "#2980b9",
                    "borderWidth": 2,
                    "fontSize": 14,
                    "padding": 12,
                    "borderRadius": 5
                },
                "failure_mode": {
                    "shape": "diamond",
                    "backgroundColor": "#e74c3c",
                    "color": "#ffffff",
                    "borderColor": "#c0392b",
                    "borderWidth": 2,
                    "fontSize": 12,
                    "padding": 10
                },
                "fault_event": {
                    "shape": "circle",
                    "backgroundColor": "#e67e22",
                    "color": "#ffffff",
                    "borderColor": "#d35400",
                    "borderWidth": 2,
                    "fontSize": 12
                },
                "system": {
                    "shape": "rectangle",
                    "backgroundColor": "#2ecc71",
                    "color": "#ffffff",
                    "borderColor": "#27ae60",
                    "borderWidth": 3,
                    "fontSize": 16,
                    "padding": 15,
                    "borderRadius": 8
                }
            },
            edge_styles={
                "function_flow": {
                    "stroke": "#2ecc71",
                    "strokeWidth": 2,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 8
                },
                "failure_propagation": {
                    "stroke": "#e74c3c",
                    "strokeWidth": 3,
                    "strokeDasharray": "5,5",
                    "animated": True,
                    "type": "step",
                    "arrowSize": 10
                },
                "component_hierarchy": {
                    "stroke": "#95a5a6",
                    "strokeWidth": 1,
                    "type": "straight",
                    "arrowSize": 6
                },
                "fault_tree_gate": {
                    "stroke": "#34495e",
                    "strokeWidth": 2,
                    "type": "smoothstep",
                    "arrowSize": 7
                }
            },
            theme={
                "name": "Automotive",
                "primaryColor": "#3498db",
                "dangerColor": "#e74c3c",
                "successColor": "#2ecc71",
                "backgroundColor": "#ecf0f1",
                "gridColor": "#bdc3c7"
            }
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            FMEARiskAnalysis(),
            FailurePropagationAnalysis(),
            CriticalComponentAnalysis()
        ]
    
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate automotive node"""
        node_type = node_data.get('type')
        
        # Check if type is valid
        valid_types = [nt.name for nt in self.get_node_types()]
        if node_type not in valid_types:
            return False
        
        # Type-specific validation
        if node_type == 'failure_mode':
            attrs = node_data.get('attributes', {})
            severity = attrs.get('severity', 0)
            occurrence = attrs.get('occurrence', 0)
            detection = attrs.get('detection', 0)
            
            # Validate FMEA ratings are 1-10
            if not (1 <= severity <= 10 and 1 <= occurrence <= 10 and 1 <= detection <= 10):
                return False
        
        return True
    
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate automotive edge"""
        edge_type = edge_data.get('type')
        
        # Check if type is valid
        valid_types = [et.name for et in self.get_edge_types()]
        if edge_type not in valid_types:
            return False
        
        # Type-specific validation
        if edge_type == 'failure_propagation':
            attrs = edge_data.get('attributes', {})
            prob = attrs.get('propagation_probability', 1.0)
            
            # Validate probability is 0-1
            if not (0.0 <= prob <= 1.0):
                return False
        
        return True
    
    def enrich_node(self, node: NodeData) -> NodeData:
        """Enrich automotive node with calculated attributes"""
        if node.type == 'failure_mode':
            # Calculate RPN if not already present
            attrs = node.attributes
            if 'rpn' not in attrs or attrs['rpn'] == 0:
                severity = attrs.get('severity', 1)
                occurrence = attrs.get('occurrence', 1)
                detection = attrs.get('detection', 1)
                attrs['rpn'] = severity * occurrence * detection
                
                # Add risk level
                rpn = attrs['rpn']
                attrs['risk_level'] = (
                    'critical' if rpn >= 200 else
                    'high' if rpn >= 100 else
                    'medium' if rpn >= 50 else
                    'low'
                )
        
        return node
    
    def get_export_formats(self) -> List[str]:
        return ['json', 'excel', 'pdf', 'graphml']
    
    @classmethod
    def register(cls):
        """
        Register the automotive domain with the global domain registry.
        
        This method instantiates the domain adapter and registers it with
        the central domain registry for discovery and use.
        """
        from backend.domains.registry import register_domain
        register_domain(cls())
