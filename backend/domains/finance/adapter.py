"""
Finance Domain Adapter

Implements the DomainAdapter interface for finance risk analysis (FMEA/FTA-style).

Domain mapping (mirrors automotive three-layer structure):
  Form layer    → Share Deposits  🏦  (portfolios, depos, brokerage accounts)
  Function layer → Investment Functions  📈  (long-term gain, short-term gain, dividends)
  Failure layer  → Financial Losses  📉  (long-term loss, short-term loss, capital loss)

This adapter provides:
- Node types: form_component (share deposit), function (investment function), failure_mode (financial loss)
- Edge types: form_hierarchy, function_flow, performs_function, loss_propagation, has_loss
- Analysis algorithms: Loss risk analysis, loss propagation, critical deposit analysis
- Validation rules for finance risk data
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
from backend.domains.finance.models import LossMode, ShareDeposit, GainNet, LossNet
# Import shared utilities to avoid circular imports
from backend.domains.finance.utils import calculate_rpn
import networkx as nx


class FinanceLossRiskAnalysis(DomainAlgorithm):
    """Finance loss risk analysis algorithm (mirrors FMEA risk analysis)"""

    @property
    def name(self) -> str:
        return "loss_risk_analysis"

    @property
    def description(self) -> str:
        return "Calculates RPN and identifies high-risk financial loss modes across share deposits"

    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run finance loss risk analysis"""
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
                        'share_deposit': attrs.get('component', 'unknown'),
                        'loss_mode': node_data.get('label', 'unknown')
                    })

        return {
            'high_risk_losses': sorted(high_risk_nodes, key=lambda x: x['rpn'], reverse=True),
            'total_analyzed': len([n for n, d in graph.graph.nodes(data=True) if d.get('type') == 'failure_mode']),
            'threshold': threshold
        }


class LossPropagationAnalysis(DomainAlgorithm):
    """Analyzes loss propagation paths across share deposits"""

    @property
    def name(self) -> str:
        return "loss_propagation"

    @property
    def description(self) -> str:
        return "Traces loss propagation paths through connected share deposits and investment functions"

    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Trace loss propagation"""
        max_depth = params.get('max_depth', 5) if params else 5

        propagation_paths = []
        loss_nodes = [
            n for n, d in graph.graph.nodes(data=True)
            if d.get('type') == 'failure_mode'
        ]

        for loss_node in loss_nodes:
            try:
                # Find all paths from this loss mode
                reachable = nx.single_source_shortest_path_length(
                    graph.graph, loss_node, cutoff=max_depth
                )

                if len(reachable) > 1:  # More than just the source
                    propagation_paths.append({
                        'source': loss_node,
                        'affected_nodes': len(reachable) - 1,
                        'reachable': list(reachable.keys())
                    })

                    # Mark propagation depth on nodes
                    for target, depth in reachable.items():
                        if target != loss_node:
                            if 'propagation_sources' not in graph.graph.nodes[target].get('attributes', {}):
                                graph.graph.nodes[target]['attributes']['propagation_sources'] = []
                            graph.graph.nodes[target]['attributes']['propagation_sources'].append({
                                'source': loss_node,
                                'depth': depth
                            })
            except Exception:
                pass

        return {
            'propagation_paths': propagation_paths,
            'most_critical': max(propagation_paths, key=lambda x: x['affected_nodes']) if propagation_paths else None
        }


class CriticalDepositAnalysis(DomainAlgorithm):
    """Identifies critical share deposits using centrality measures"""

    @property
    def name(self) -> str:
        return "critical_deposits"

    @property
    def description(self) -> str:
        return "Identifies critical share deposits based on network centrality across loss propagation paths"

    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Identify critical share deposits"""
        top_n = params.get('top_n', 5) if params else 5

        # Calculate betweenness centrality
        centrality = nx.betweenness_centrality(graph.graph)

        # Update nodes with centrality scores
        for node_id, score in centrality.items():
            graph.graph.nodes[node_id]['attributes']['centrality_score'] = score
            graph.graph.nodes[node_id]['attributes']['is_critical'] = score > 0.1

        # Get top critical nodes
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:top_n]

        critical_deposits = []
        for node_id, score in sorted_nodes:
            node_data = graph.graph.nodes[node_id]
            critical_deposits.append({
                'node_id': node_id,
                'share_deposit': node_data.get('label', 'unknown'),
                'centrality_score': score,
                'type': node_data.get('type', 'unknown')
            })

        return {
            'critical_deposits': critical_deposits,
            'average_centrality': sum(centrality.values()) / len(centrality) if centrality else 0
        }


class FinanceDomain(DomainAdapter):
    """
    Finance domain adapter — mirrors the automotive three-layer FMEA/FTA structure.

    Layer mapping:
      Form     → Share Deposits  🏦  (portfolios, custodian depots, brokerage accounts)
      Function → Investment Functions  📈  (long-term gain, short-term gain, dividends, rebalancing)
      Failure  → Financial Losses  📉  (long-term capital loss, short-term trading loss, dividend loss)
    """

    @property
    def domain_name(self) -> str:
        return "finance"

    @property
    def domain_display_name(self) -> str:
        return "Finance"

    @property
    def description(self) -> str:
        return (
            "Risk analysis for financial systems: share deposit modeling, "
            "investment function mapping, and loss mode assessment (long-term / short-term)"
        )

    def get_node_types(self) -> List[DomainNodeType]:
        return [
            # Form Layer — Share Deposits
            DomainNodeType(
                name="form_component",
                display_name="Share Deposit (Form)",
                icon="🏦",
                description="Share deposit, portfolio, or custodian depot (Form Element)",
                default_attributes={
                    "layer": "form",
                    "characteristics": {},   # depot_id, asset_class, owner, regulation
                    "properties": {}         # volume, exposure, volatility, liquidity
                }
            ),
            # Function Layer — Investment Functions
            DomainNodeType(
                name="function",
                display_name="Investment Function",
                icon="📈",
                description="Investment function (e.g. Long-Term Gain, Short-Term Gain, Dividend Yield)",
                default_attributes={
                    "layer": "function",
                    "inputs": [],
                    "outputs": [],
                    "performance_metrics": {}
                }
            ),
            # Failure Layer — Financial Losses
            DomainNodeType(
                name="failure_mode",
                display_name="Financial Loss",
                icon="📉",
                description="Potential financial loss (e.g. Long-Term Capital Loss, Short-Term Trading Loss)",
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
                display_name="Deposit Hierarchy",
                description="Parent-child relationship between share deposit accounts",
                directed=True,
                default_attributes={
                    "relationship_type": "contains",
                    "relation": "form_hierarchy"
                }
            ),
            # Function Layer Edges
            DomainEdgeType(
                name="function_flow",
                display_name="Gain Flow",
                description="Investment gain dependency/flow (long-term, short-term, dividend)",
                directed=True,
                default_attributes={
                    "connection_type": "sequential",   # sequential, parallel, conditional
                    "reliability": 1.0,
                    "latency": 0.0,
                    "relation": "function_flow"
                }
            ),
            DomainEdgeType(
                name="performs_function",
                display_name="Performs Investment Function",
                description="Share deposit performs an investment function",
                directed=True,
                default_attributes={
                    "relation": "performs"
                }
            ),
            # Failure Layer Edges
            DomainEdgeType(
                name="loss_propagation",
                display_name="Loss Propagation",
                description="How a financial loss propagates through connected deposits",
                directed=True,
                default_attributes={
                    "propagation_probability": 1.0,
                    "propagation_mechanism": "",
                    "time_to_propagate": None,
                    "relation": "propagates_to"
                }
            ),
            DomainEdgeType(
                name="has_loss",
                display_name="Has Financial Loss",
                description="Share deposit / investment function has a loss mode",
                directed=True,
                default_attributes={
                    "relation": "has_loss"
                }
            ),
        ]

    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                # Form Layer — Share Deposits (deep blue, rectangular)
                "form_component": {
                    "shape": "rectangle",
                    "backgroundColor": "#1a6eb5",
                    "color": "#ffffff",
                    "borderColor": "#145490",
                    "borderWidth": 2,
                    "fontSize": 14,
                    "padding": 12,
                    "borderRadius": 5
                },
                # Function Layer — Investment Functions (green, hexagon — gains)
                "function": {
                    "shape": "hexagon",
                    "backgroundColor": "#27ae60",
                    "color": "#ffffff",
                    "borderColor": "#1e8449",
                    "borderWidth": 2,
                    "fontSize": 13,
                    "padding": 11,
                    "borderRadius": 4
                },
                # Failure Layer — Financial Losses (red, diamond — losses)
                "failure_mode": {
                    "shape": "diamond",
                    "backgroundColor": "#c0392b",
                    "color": "#ffffff",
                    "borderColor": "#96281b",
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
                    "stroke": "#27ae60",
                    "strokeWidth": 2,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 8
                },
                "performs_function": {
                    "stroke": "#1a6eb5",
                    "strokeWidth": 2,
                    "strokeDasharray": "5,3",
                    "type": "step",
                    "arrowSize": 7
                },
                # Failure Layer Edges
                "loss_propagation": {
                    "stroke": "#c0392b",
                    "strokeWidth": 3,
                    "strokeDasharray": "5,5",
                    "animated": True,
                    "type": "step",
                    "arrowSize": 10
                },
                "has_loss": {
                    "stroke": "#e67e22",
                    "strokeWidth": 2,
                    "strokeDasharray": "3,3",
                    "type": "straight",
                    "arrowSize": 7
                },
            },
            theme={
                "name": "Finance",
                "primaryColor": "#1a6eb5",
                "dangerColor": "#c0392b",
                "successColor": "#27ae60",
                "backgroundColor": "#ecf0f1",
                "gridColor": "#bdc3c7",
                "formLayerColor": "#1a6eb5",
                "functionLayerColor": "#27ae60",
                "failureLayerColor": "#c0392b"
            }
        )

    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            FinanceLossRiskAnalysis(),
            LossPropagationAnalysis(),
            CriticalDepositAnalysis()
        ]

    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate finance node"""
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

            # Validate loss ratings are 1-10
            if not (1 <= severity <= 10 and 1 <= occurrence <= 10 and 1 <= detection <= 10):
                return False

        return True

    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate finance edge"""
        edge_type = edge_data.get('type')

        # Check if type is valid
        valid_types = [et.name for et in self.get_edge_types()]
        if edge_type not in valid_types:
            return False

        # Type-specific validation
        if edge_type == 'loss_propagation':
            attrs = edge_data.get('attributes', {})
            prob = attrs.get('propagation_probability', 1.0)

            # Validate probability is 0-1
            if not (0.0 <= prob <= 1.0):
                return False

        return True

    def enrich_node(self, node: NodeData) -> NodeData:
        """Enrich finance node with calculated attributes"""
        if node.type == 'failure_mode':
            # Calculate RPN if not already present
            attrs = node.attributes
            if 'rpn' not in attrs or attrs['rpn'] == 0:
                severity = attrs.get('severity', 1)
                occurrence = attrs.get('occurrence', 1)
                detection = attrs.get('detection', 1)
                attrs['rpn'] = calculate_rpn(severity, occurrence, detection)

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
        Register the finance domain with the global domain registry.

        This method instantiates the domain adapter and registers it with
        the central domain registry for discovery and use.
        """
        from backend.domains.registry import register_domain
        register_domain(cls())
