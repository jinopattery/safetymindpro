"""
FMEA calculations and analysis functions

This module provides calculation and analysis functionality for FMEA data.

Import Management:
- Imports models (FMEAAnalysis, FailureMode, etc.) for type annotations and analysis
- Imports calculate_rpn from utils.py (not models.py) to avoid circular imports
- The utils module acts as a shared dependency layer, breaking the circular reference
"""
from typing import List, Dict, Any, Tuple

# Import models for type annotations and analysis
from backend.domains.automotive.models import (
    FMEAAnalysis,
    FailureMode,
    Component,
    FailureNet
)
# Import shared utilities to avoid circular imports
from backend.domains.automotive.utils import calculate_rpn
from backend.core.graph import Graph, NodeData, EdgeData
from backend.core.algorithms import GraphAlgorithms

class FMEACalculator:
    """FMEA calculation engine"""
    
    @staticmethod
    def calculate_all_rpn(analysis: FMEAAnalysis) -> FMEAAnalysis:
        """Calculate RPN for all failure modes
        
        Args:
            analysis: FMEA analysis
            
        Returns:
            Updated analysis
        """
        for failure_mode in analysis.failure_modes:
            failure_mode.calculate_rpn()
        
        return analysis
    
    @staticmethod
    def rank_failures(analysis: FMEAAnalysis) -> List[FailureMode]:
        """Rank failure modes by RPN
        
        Args:
            analysis: FMEA analysis
            
        Returns:
            Sorted list of failure modes
        """
        return sorted(
            analysis.failure_modes,
            key=lambda fm: fm.rpn,
            reverse=True
        )
    
    @staticmethod
    def build_failure_graph(analysis: FMEAAnalysis) -> Graph:
        """Build graph representation of failure propagation
        
        Args:
            analysis: FMEA analysis
            
        Returns:
            Graph instance
        """
        graph = Graph(directed=True)
        
        # Add component nodes
        for component in analysis.components:
            node = NodeData(
                id=component.id,
                type="component",
                label=component.name,
                domain="automotive",
                attributes={
                    "component_type": component.type,
                    "functions": component.functions,
                    "description": component.description
                }
            )
            graph.add_node(node)
        
        # Add failure mode nodes
        for failure_mode in analysis.failure_modes:
            node = NodeData(
                id=failure_mode.id,
                type="failure_mode",
                label=failure_mode.name,
                domain="automotive",
                attributes={
                    "component_id": failure_mode.component_id,
                    "severity": failure_mode.severity,
                    "occurrence": failure_mode.occurrence,
                    "detection": failure_mode.detection,
                    "rpn": failure_mode.rpn,
                    "effects": failure_mode.effects,
                    "causes": failure_mode.causes
                }
            )
            graph.add_node(node)
            
            # Link failure mode to component
            edge = EdgeData(
                source=failure_mode.component_id,
                target=failure_mode.id,
                type="has_failure_mode",
                weight=1.0
            )
            graph.add_edge(edge)
        
        # Add failure propagation edges
        for failure_link in analysis.failure_net:
            edge = EdgeData(
                source=failure_link.source_failure,
                target=failure_link.target_component,
                type="failure_propagation",
                weight=failure_link.propagation_probability,
                attributes={
                    "mechanism": failure_link.propagation_mechanism,
                    "time_to_propagate": failure_link.time_to_propagate
                }
            )
            graph.add_edge(edge)
        
        return graph
    
    @staticmethod
    def find_critical_components(
        analysis: FMEAAnalysis,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """Identify critical components based on failure impact
        
        Args:
            analysis: FMEA analysis
            top_n: Number of top components
            
        Returns:
            List of critical components with metrics
        """
        graph = FMEACalculator.build_failure_graph(analysis)
        critical = GraphAlgorithms.critical_nodes(graph, top_n)
        
        # Filter to only components
        return [
            c for c in critical
            if c['data']['type'] == 'component'
        ]
    
    @staticmethod
    def analyze_failure_cascades(
        analysis: FMEAAnalysis,
        failure_mode_id: str
    ) -> List[List[str]]:
        """Analyze potential failure cascades from a failure mode
        
        Args:
            analysis: FMEA analysis
            failure_mode_id: Starting failure mode
            
        Returns:
            List of cascade paths
        """
        graph = FMEACalculator.build_failure_graph(analysis)
        paths = GraphAlgorithms.failure_propagation_paths(
            graph,
            failure_mode_id,
            max_depth=5
        )
        
        return paths
    
    @staticmethod
    def suggest_mitigations(failure_mode: FailureMode) -> List[str]:
        """Suggest mitigation strategies based on RPN components
        
        Args:
            failure_mode: Failure mode to analyze
            
        Returns:
            List of suggestions
        """
        suggestions = []
        
        if failure_mode.severity >= 8:
            suggestions.append(
                "High severity: Consider design changes to eliminate or reduce failure mode"
            )
        
        if failure_mode.occurrence >= 7:
            suggestions.append(
                "High occurrence: Implement preventive controls or improve component reliability"
            )
        
        if failure_mode.detection >= 7:
            suggestions.append(
                "Poor detection: Add sensors, alarms, or improve testing procedures"
            )
        
        if failure_mode.rpn >= 200:
            suggestions.append(
                "Critical RPN: Immediate action required - assign high priority"
            )
        elif failure_mode.rpn >= 100:
            suggestions.append(
                "High RPN: Action recommended - schedule mitigation activities"
            )
        
        return suggestions
    
    @staticmethod
    def generate_fmea_report(analysis: FMEAAnalysis) -> Dict[str, Any]:
        """Generate comprehensive FMEA report
        
        Args:
            analysis: FMEA analysis
            
        Returns:
            Report data
        """
        ranked_failures = FMEACalculator.rank_failures(analysis)
        high_risk = analysis.get_high_risk_failures(threshold=100)
        critical_components = FMEACalculator.find_critical_components(analysis)
        
        return {
            "summary": {
                "total_components": len(analysis.components),
                "total_failure_modes": len(analysis.failure_modes),
                "high_risk_count": len(high_risk),
                "average_rpn": sum(fm.rpn for fm in analysis.failure_modes) / len(analysis.failure_modes)
                if analysis.failure_modes else 0
            },
            "top_failures": [
                {
                    "id": fm.id,
                    "name": fm.name,
                    "component_id": fm.component_id,
                    "rpn": fm.rpn,
                    "severity": fm.severity,
                    "occurrence": fm.occurrence,
                    "detection": fm.detection,
                    "suggestions": FMEACalculator.suggest_mitigations(fm)
                }
                for fm in ranked_failures[:10]
            ],
            "critical_components": critical_components,
            "high_risk_failures": [fm.model_dump() for fm in high_risk]
        }