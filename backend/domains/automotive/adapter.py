"""
Automotive Domain Adapter

Implements the DomainAdapter interface for automotive safety analysis (FMEA, FTA).

This adapter provides:
- Node types: component, failure_mode, fault_event, system
- Edge types: function_flow, failure_propagation, component_hierarchy, fault_tree_gate
- Analysis algorithms: FMEA risk analysis, failure propagation, critical components
- Validation rules for automotive safety data
- Export formats: JSON, Excel, PDF, GraphML

Import Management:
- Imports from utils.py for shared utilities (calculate_rpn) to avoid circular imports
- The adapter is registered with the domain registry via the register() class method
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


class SeverityTraceability(DomainAlgorithm):
    """
    Traces severity propagation through the failure tree.

    Uses ASIL / severity ratings on failure nodes to compute the maximum
    severity reachable from each failure and identify high-impact root causes.
    Works with the React Flow graph format (data.attributes on each node).
    """

    @property
    def name(self) -> str:
        return "severity_traceability"

    @property
    def description(self) -> str:
        return "Traces severity through the failure tree and identifies high-impact root causes (FMEA RPN)"

    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Trace severity through failure propagation tree"""
        severity_threshold = (params or {}).get('severity_threshold', 7)

        # Build severity map from node attributes (React Flow format)
        severity_map: Dict[str, float] = {}
        rpn_map: Dict[str, float] = {}
        label_map: Dict[str, str] = {}

        for node_id, node_data in graph.graph.nodes(data=True):
            # Handle both flat NodeData format and React Flow nested 'data' dict
            attrs = node_data.get('attributes', {})
            nested = node_data.get('data', {})
            nested_attrs = nested.get('attributes', {}) if isinstance(nested, dict) else {}

            severity = (
                attrs.get('severity')
                or nested_attrs.get('severity')
                or 1
            )
            occurrence = (
                attrs.get('occurrence')
                or nested_attrs.get('occurrence')
                or 1
            )
            detection = (
                attrs.get('detection')
                or nested_attrs.get('detection')
                or 1
            )
            label = (
                node_data.get('label')
                or (nested.get('label') if isinstance(nested, dict) else None)
                or node_id
            )

            severity_map[node_id] = float(severity)
            rpn_map[node_id] = float(severity) * float(occurrence) * float(detection)
            label_map[node_id] = str(label)

        if not severity_map:
            return {
                'severity_tree': [],
                'high_severity_roots': [],
                'max_severity': 0,
                'total_failures_analyzed': 0,
            }

        # BFS/DFS forward traversal to find max downstream severity for each node
        max_downstream: Dict[str, float] = {}

        def _max_sev(node_id: str, visited: set) -> float:
            if node_id in max_downstream:
                return max_downstream[node_id]
            if node_id in visited:
                return severity_map.get(node_id, 1)
            visited.add(node_id)
            own_sev = severity_map.get(node_id, 1)
            children_sev = [
                _max_sev(c, visited)
                for c in graph.graph.successors(node_id)
            ]
            result = max([own_sev] + children_sev)
            max_downstream[node_id] = result
            return result

        for nid in list(graph.graph.nodes()):
            _max_sev(nid, set())

        # Build traceability report
        severity_tree = []
        for node_id in graph.graph.nodes():
            sev = severity_map.get(node_id, 1)
            max_sev = max_downstream.get(node_id, sev)
            rpn = rpn_map.get(node_id, sev)
            in_deg = graph.graph.in_degree(node_id)
            out_deg = graph.graph.out_degree(node_id)
            severity_tree.append({
                'node_id': node_id,
                'label': label_map.get(node_id, node_id),
                'severity': sev,
                'rpn': round(rpn, 2),
                'max_downstream_severity': max_sev,
                'is_root': in_deg == 0,
                'propagates_to': out_deg,
                'is_high_severity': sev >= severity_threshold,
            })

        severity_tree.sort(key=lambda x: x['max_downstream_severity'], reverse=True)

        high_severity_roots = [
            e for e in severity_tree
            if e['is_root'] and e['max_downstream_severity'] >= severity_threshold
        ]

        return {
            'severity_tree': severity_tree[:20],  # top 20
            'high_severity_roots': high_severity_roots,
            'max_severity': max(severity_map.values()) if severity_map else 0,
            'total_failures_analyzed': len(severity_tree),
            'severity_threshold': severity_threshold,
        }


class DependencyFactor(DomainAlgorithm):
    """
    Computes the dependency factor for each function in the functional network.

    Dependency Factor = in_degree / (in_degree + out_degree + 1)
    A higher factor means the function depends on more upstream functions
    and could be a bottleneck if those upstream functions fail.
    Works with the React Flow graph format.
    """

    @property
    def name(self) -> str:
        return "dependency_factor"

    @property
    def description(self) -> str:
        return "Computes dependency factor for each function in the functional network (bottleneck analysis)"

    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Compute dependency factor for all functions"""
        top_n = (params or {}).get('top_n', 10)

        dependency_data = []
        for node_id, node_data in graph.graph.nodes(data=True):
            # Extract label
            nested = node_data.get('data', {})
            label = (
                node_data.get('label')
                or (nested.get('label') if isinstance(nested, dict) else None)
                or node_id
            )

            in_deg = graph.graph.in_degree(node_id)
            out_deg = graph.graph.out_degree(node_id)
            total = in_deg + out_deg

            if total == 0:
                dep_factor = 0.0
                influence = 0.0
            else:
                dep_factor = in_deg / (total + 1)
                influence = out_deg / (total + 1)

            # Betweenness centrality (normalized) for additional insight
            dependency_data.append({
                'node_id': node_id,
                'label': str(label),
                'in_degree': in_deg,
                'out_degree': out_deg,
                'dependency_factor': round(dep_factor, 4),
                'influence_factor': round(influence, 4),
                'is_bottleneck': in_deg > 1 and out_deg > 1,
            })

        dependency_data.sort(key=lambda x: x['dependency_factor'], reverse=True)

        high_dependency = [d for d in dependency_data if d['dependency_factor'] > 0.3]
        bottlenecks = [d for d in dependency_data if d['is_bottleneck']]

        return {
            'dependency_factors': dependency_data[:int(top_n)],
            'high_dependency_functions': high_dependency,
            'bottlenecks': bottlenecks,
            'total_nodes_analyzed': len(dependency_data),
            'average_dependency_factor': round(
                sum(d['dependency_factor'] for d in dependency_data) / len(dependency_data), 4
            ) if dependency_data else 0,
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
        return "Automotive"
    
    @property
    def description(self) -> str:
        return "FMEA and FTA analysis for automotive systems including component modeling, failure modes, and risk assessment"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            # Form Layer Nodes (Physical/Logical Structure)
            DomainNodeType(
                name="form_component",
                display_name="Component (Form)",
                icon="🔧",
                description="Automotive component or subsystem (Form Element)",
                default_attributes={
                    "layer": "form",
                    "characteristics": {},  # Static properties: part_number, material, supplier
                    "properties": {}  # Time-series: temperature, vibration, wear
                }
            ),
            # Function Layer Nodes (Behavioral Structure)
            DomainNodeType(
                name="function",
                display_name="Function",
                icon="⚙️",
                description="System function (e.g., Brake Vehicle, Decelerate)",
                default_attributes={
                    "layer": "function",
                    "inputs": [],
                    "outputs": [],
                    "performance_metrics": {}
                }
            ),
            # Failure Layer Nodes (Risk Structure)
            DomainNodeType(
                name="failure_mode",
                display_name="Failure Mode",
                icon="⚠️",
                description="Potential failure mode (Failure Layer)",
                default_attributes={
                    "layer": "failure",
                    "severity": 1,
                    "occurrence": 1,
                    "detection": 1,
                    "rpn": 0,
                    "effects": [],
                    "causes": [],
                    "controls": []
                }
            ),
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            # Form Layer Edges
            DomainEdgeType(
                name="form_hierarchy",
                display_name="Form Hierarchy",
                description="Parent-child relationship between form elements",
                directed=True,
                default_attributes={
                    "relationship_type": "contains",
                    "relation": "form_hierarchy"
                }
            ),
            # Function Layer Edges
            DomainEdgeType(
                name="function_flow",
                display_name="Function Flow",
                description="Function dependency/flow (sequential, parallel, conditional)",
                directed=True,
                default_attributes={
                    "connection_type": "sequential",  # sequential, parallel, conditional
                    "reliability": 1.0,
                    "latency": 0.0,
                    "relation": "function_flow"
                }
            ),
            DomainEdgeType(
                name="performs_function",
                display_name="Performs Function",
                description="Form element performs a function",
                directed=True,
                default_attributes={
                    "relation": "performs"
                }
            ),
            # Failure Layer Edges
            DomainEdgeType(
                name="failure_propagation",
                display_name="Failure Propagation",
                description="How a failure propagates through the system",
                directed=True,
                default_attributes={
                    "propagation_probability": 1.0,
                    "propagation_mechanism": "",
                    "time_to_propagate": None,
                    "relation": "propagates_to"
                }
            ),
            DomainEdgeType(
                name="has_failure",
                display_name="Has Failure Mode",
                description="Form/Function has a failure mode",
                directed=True,
                default_attributes={
                    "relation": "has_failure"
                }
            ),
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                # Form Layer Styles
                "form_component": {
                    "shape": "rectangle",
                    "backgroundColor": "#3498db",
                    "color": "#ffffff",
                    "borderColor": "#2980b9",
                    "borderWidth": 2,
                    "fontSize": 14,
                    "padding": 12,
                    "borderRadius": 5
                },
                # Function Layer Styles
                "function": {
                    "shape": "hexagon",
                    "backgroundColor": "#9b59b6",
                    "color": "#ffffff",
                    "borderColor": "#8e44ad",
                    "borderWidth": 2,
                    "fontSize": 13,
                    "padding": 11,
                    "borderRadius": 4
                },
                # Failure Layer Styles
                "failure_mode": {
                    "shape": "diamond",
                    "backgroundColor": "#e74c3c",
                    "color": "#ffffff",
                    "borderColor": "#c0392b",
                    "borderWidth": 2,
                    "fontSize": 12,
                    "padding": 10
                },
            },
            edge_styles={
                # Form Layer Edges
                "form_hierarchy": {
                    "stroke": "#95a5a6",
                    "strokeWidth": 1,
                    "type": "straight",
                    "arrowSize": 6
                },
                # Function Layer Edges
                "function_flow": {
                    "stroke": "#9b59b6",
                    "strokeWidth": 2,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 8
                },
                "performs_function": {
                    "stroke": "#3498db",
                    "strokeWidth": 2,
                    "strokeDasharray": "5,3",
                    "type": "step",
                    "arrowSize": 7
                },
                # Failure Layer Edges
                "failure_propagation": {
                    "stroke": "#e74c3c",
                    "strokeWidth": 3,
                    "strokeDasharray": "5,5",
                    "animated": True,
                    "type": "step",
                    "arrowSize": 10
                },
                "has_failure": {
                    "stroke": "#e67e22",
                    "strokeWidth": 2,
                    "strokeDasharray": "3,3",
                    "type": "straight",
                    "arrowSize": 7
                },
            },
            theme={
                "name": "Automotive",
                "primaryColor": "#3498db",
                "dangerColor": "#e74c3c",
                "successColor": "#2ecc71",
                "backgroundColor": "#ecf0f1",
                "gridColor": "#bdc3c7",
                "formLayerColor": "#3498db",
                "functionLayerColor": "#9b59b6",
                "failureLayerColor": "#e74c3c"
            }
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            FMEARiskAnalysis(),
            FailurePropagationAnalysis(),
            CriticalComponentAnalysis(),
            SeverityTraceability(),
            DependencyFactor(),
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
