"""
Finance risk calculations and analysis functions

This module provides calculation and analysis functionality for finance risk data.

Domain mapping:
- Form layer  → Share Deposits (portfolios, depos, share accounts)
- Function layer → Investment functions (long-term gain, short-term gain, dividends, etc.)
- Failure layer → Financial losses (long-term loss, short-term loss, capital loss, etc.)

Import Management:
- Imports models (FinanceAnalysis, LossMode, etc.) for type annotations and analysis
- Imports calculate_rpn from utils.py (not models.py) to avoid circular imports
- The utils module acts as a shared dependency layer, breaking the circular reference
"""
from typing import List, Dict, Any

# Import models for type annotations and analysis
from backend.domains.finance.models import (
    FinanceAnalysis,
    LossMode,
    ShareDeposit,
    LossNet
)
# Import shared utilities to avoid circular imports
from backend.domains.finance.utils import calculate_rpn
from backend.core.graph import Graph, NodeData, EdgeData
from backend.core.algorithms import GraphAlgorithms


class FinanceRiskCalculator:
    """Finance risk calculation engine"""

    @staticmethod
    def calculate_all_rpn(analysis: FinanceAnalysis) -> FinanceAnalysis:
        """Calculate RPN for all loss modes

        Args:
            analysis: Finance risk analysis

        Returns:
            Updated analysis
        """
        for loss_mode in analysis.risk_modes:
            loss_mode.calculate_rpn()

        return analysis

    @staticmethod
    def rank_risks(analysis: FinanceAnalysis) -> List[LossMode]:
        """Rank loss modes by RPN

        Args:
            analysis: Finance risk analysis

        Returns:
            Sorted list of loss modes
        """
        return sorted(
            analysis.risk_modes,
            key=lambda rm: rm.rpn,
            reverse=True
        )

    @staticmethod
    def build_risk_graph(analysis: FinanceAnalysis) -> Graph:
        """Build graph representation of loss propagation

        Args:
            analysis: Finance risk analysis

        Returns:
            Graph instance
        """
        graph = Graph(directed=True)

        # Add share deposit nodes (Form layer)
        for component in analysis.components:
            node = NodeData(
                id=component.id,
                type="form_component",
                label=component.name,
                domain="finance",
                attributes={
                    "component_type": component.type,
                    "investment_functions": component.investment_functions,
                    "description": component.description
                }
            )
            graph.add_node(node)

        # Add loss mode nodes (Failure layer)
        for loss_mode in analysis.risk_modes:
            node = NodeData(
                id=loss_mode.id,
                type="failure_mode",
                label=loss_mode.name,
                domain="finance",
                attributes={
                    "component_id": loss_mode.component_id,
                    "severity": loss_mode.severity,
                    "occurrence": loss_mode.occurrence,
                    "detection": loss_mode.detection,
                    "rpn": loss_mode.rpn,
                    "effects": loss_mode.effects,
                    "causes": loss_mode.causes
                }
            )
            graph.add_node(node)

            # Link loss mode to share deposit
            edge = EdgeData(
                source=loss_mode.component_id,
                target=loss_mode.id,
                type="has_loss_mode",
                weight=1.0
            )
            graph.add_edge(edge)

        # Add loss propagation edges
        for loss_link in analysis.loss_net:
            edge = EdgeData(
                source=loss_link.source_loss,
                target=loss_link.target_component,
                type="loss_propagation",
                weight=loss_link.propagation_probability,
                attributes={
                    "mechanism": loss_link.propagation_mechanism,
                    "time_to_propagate": loss_link.time_to_propagate
                }
            )
            graph.add_edge(edge)

        return graph

    @staticmethod
    def find_critical_components(
        analysis: FinanceAnalysis,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """Identify critical share deposits based on loss impact

        Args:
            analysis: Finance risk analysis
            top_n: Number of top components

        Returns:
            List of critical share deposits with metrics
        """
        graph = FinanceRiskCalculator.build_risk_graph(analysis)
        critical = GraphAlgorithms.critical_nodes(graph, top_n)

        # Filter to only share deposit nodes (form layer)
        return [
            c for c in critical
            if c['data']['type'] == 'form_component'
        ]

    @staticmethod
    def analyze_loss_cascades(
        analysis: FinanceAnalysis,
        loss_mode_id: str
    ) -> List[List[str]]:
        """Analyze potential loss cascades from a loss mode

        Args:
            analysis: Finance risk analysis
            loss_mode_id: Starting loss mode

        Returns:
            List of cascade paths
        """
        graph = FinanceRiskCalculator.build_risk_graph(analysis)
        paths = GraphAlgorithms.failure_propagation_paths(
            graph,
            loss_mode_id,
            max_depth=5
        )

        return paths

    @staticmethod
    def suggest_mitigations(loss_mode: LossMode) -> List[str]:
        """Suggest mitigation strategies based on RPN components

        Args:
            loss_mode: Loss mode to analyze

        Returns:
            List of suggestions
        """
        suggestions = []

        if loss_mode.severity >= 8:
            suggestions.append(
                "High severity: Consider portfolio restructuring to reduce exposure"
            )

        if loss_mode.occurrence >= 7:
            suggestions.append(
                "High occurrence: Implement hedging or diversification controls"
            )

        if loss_mode.detection >= 7:
            suggestions.append(
                "Poor detection: Add real-time monitoring, alerts, or audit trails"
            )

        if loss_mode.rpn >= 200:
            suggestions.append(
                "Critical RPN: Immediate action required - assign high priority"
            )
        elif loss_mode.rpn >= 100:
            suggestions.append(
                "High RPN: Action recommended - schedule mitigation activities"
            )

        return suggestions

    @staticmethod
    def generate_risk_report(analysis: FinanceAnalysis) -> Dict[str, Any]:
        """Generate comprehensive finance risk report

        Args:
            analysis: Finance risk analysis

        Returns:
            Report data
        """
        ranked_risks = FinanceRiskCalculator.rank_risks(analysis)
        high_risk = analysis.get_high_risk_modes(threshold=100)
        critical_components = FinanceRiskCalculator.find_critical_components(analysis)

        return {
            "summary": {
                "total_share_deposits": len(analysis.components),
                "total_loss_modes": len(analysis.risk_modes),
                "high_risk_count": len(high_risk),
                "average_rpn": (
                    sum(rm.rpn for rm in analysis.risk_modes) / len(analysis.risk_modes)
                    if analysis.risk_modes else 0
                )
            },
            "top_risks": [
                {
                    "id": rm.id,
                    "name": rm.name,
                    "component_id": rm.component_id,
                    "rpn": rm.rpn,
                    "severity": rm.severity,
                    "occurrence": rm.occurrence,
                    "detection": rm.detection,
                    "suggestions": FinanceRiskCalculator.suggest_mitigations(rm)
                }
                for rm in ranked_risks[:10]
            ],
            "critical_components": critical_components,
            "high_risk_modes": [rm.model_dump() for rm in high_risk]
        }
