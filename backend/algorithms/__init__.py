"""
Universal Algorithms Package

Domain-independent algorithms that work on the universal graph structure.
"""

from backend.algorithms.structural_analysis import (
    compute_criticality,
    analyze_structure
)
from backend.algorithms.functional_analysis import (
    analyze_function_tree,
    identify_function_bottlenecks
)
from backend.algorithms.risk_analysis import (
    analyze_failure_propagation,
    compute_risk_priority
)
from backend.algorithms.timeseries_analysis import (
    analyze_timeseries,
    detect_anomalies
)

__all__ = [
    'compute_criticality',
    'analyze_structure',
    'analyze_function_tree',
    'identify_function_bottlenecks',
    'analyze_failure_propagation',
    'compute_risk_priority',
    'analyze_timeseries',
    'detect_anomalies'
]
