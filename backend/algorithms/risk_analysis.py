"""
Risk Analysis - Failure-Centric Algorithms

Domain-independent risk analysis algorithms that work on the failure layer
of the universal graph. These algorithms analyze failure propagation and
compute risk priorities.
"""

from typing import Dict, List, Any, Set, Tuple
import networkx as nx
from backend.core.universal_graph import UniversalGraph, FailureMode


def analyze_failure_propagation(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze failure propagation through the system.
    
    Returns:
    - Propagation paths
    - Critical failures
    - Cascading risks
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary with failure propagation analysis
    """
    propagation_paths = compute_propagation_paths(graph)
    
    return {
        'propagation_paths': propagation_paths,
        'critical_failures': identify_critical_failures(graph),
        'cascading_risks': analyze_cascading_failures(graph),
        'risk_priorities': compute_risk_priority(graph)
    }


def compute_risk_priority(graph: UniversalGraph) -> List[Dict[str, Any]]:
    """
    Compute risk priority numbers for all failures.
    
    Domain-independent formula:
    Risk = Severity × Probability × (1 - Detectability/10)
    
    Works for:
    - Automotive: RPN from FMEA
    - Financial: Fraud risk score
    - Process Plant: Hazard risk
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        List of failures sorted by risk priority
    """
    risk_priorities = []
    
    for failure_id, failure in graph.failure_modes.items():
        # Compute risk score
        detectability_factor = 1.0
        if failure.detectability > 0:
            detectability_factor = 1.0 - (failure.detectability / 10.0)
        
        risk_score = failure.severity * failure.probability * detectability_factor
        
        # Trace impact
        affected_functions = trace_function_impact(failure, graph)
        affected_forms = trace_form_impact(failure, graph)
        
        risk_priorities.append({
            'failure_id': failure_id,
            'failure_name': failure.name,
            'risk_score': risk_score,
            'severity': failure.severity,
            'probability': failure.probability,
            'detectability': failure.detectability,
            'functions_affected': affected_functions,
            'forms_affected': affected_forms,
            'propagation_count': len(failure.propagates_to),
            'mitigation_count': len(failure.mitigated_by)
        })
    
    # Sort by risk score (highest first)
    risk_priorities.sort(key=lambda x: x['risk_score'], reverse=True)
    
    return risk_priorities


def compute_propagation_paths(graph: UniversalGraph) -> List[Dict[str, Any]]:
    """
    Compute all failure propagation paths.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        List of propagation paths with probabilities
    """
    propagation_paths = []
    
    for failure_id, failure in graph.failure_modes.items():
        # Find all reachable failures from this one
        reachable = _find_reachable_failures(failure_id, graph)
        
        if reachable:
            # Compute propagation probability
            path_probability = _compute_propagation_probability(failure_id, reachable, graph)
            
            propagation_paths.append({
                'source_failure': failure_id,
                'source_name': failure.name,
                'reachable_failures': reachable,
                'propagation_probability': path_probability,
                'path_length': len(reachable)
            })
    
    return propagation_paths


def identify_critical_failures(graph: UniversalGraph, threshold: float = 0.5) -> List[Dict[str, Any]]:
    """
    Identify critical failures based on multiple criteria.
    
    Critical = high risk AND (affects many components OR propagates widely)
    
    Args:
        graph: UniversalGraph instance
        threshold: Risk threshold for criticality
        
    Returns:
        List of critical failures
    """
    critical_failures = []
    
    for failure_id, failure in graph.failure_modes.items():
        # Calculate risk score
        risk_score = failure.severity * failure.probability
        
        # Count impact
        impact_count = len(failure.affects_functions) + len(failure.affects_forms)
        propagation_count = len(failure.propagates_to)
        
        # Determine criticality
        is_critical = (
            risk_score > threshold or
            impact_count > 5 or
            propagation_count > 3
        )
        
        if is_critical:
            critical_failures.append({
                'failure_id': failure_id,
                'failure_name': failure.name,
                'risk_score': risk_score,
                'impact_count': impact_count,
                'propagation_count': propagation_count,
                'severity': failure.severity,
                'probability': failure.probability,
                'criticality_score': risk_score * (1 + impact_count * 0.1 + propagation_count * 0.2)
            })
    
    # Sort by criticality score
    critical_failures.sort(key=lambda x: x['criticality_score'], reverse=True)
    
    return critical_failures


def analyze_cascading_failures(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze cascading failure scenarios.
    
    Cascading = failure triggers multiple other failures
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Cascading failure analysis
    """
    cascading_scenarios = []
    
    for failure_id, failure in graph.failure_modes.items():
        # Find all failures in cascade
        cascade = _compute_failure_cascade(failure_id, graph)
        
        if len(cascade) > 1:  # At least one propagation
            # Compute cascade probability
            cascade_probability = _compute_cascade_probability(failure_id, cascade, graph)
            
            cascading_scenarios.append({
                'initiating_failure': failure_id,
                'initiating_name': failure.name,
                'cascade_size': len(cascade),
                'cascade_failures': cascade,
                'cascade_probability': cascade_probability,
                'severity': _compute_cascade_severity(cascade, graph)
            })
    
    # Sort by cascade size and probability
    cascading_scenarios.sort(
        key=lambda x: x['cascade_size'] * x['cascade_probability'],
        reverse=True
    )
    
    return {
        'scenarios': cascading_scenarios,
        'max_cascade_size': max([s['cascade_size'] for s in cascading_scenarios]) if cascading_scenarios else 0,
        'total_scenarios': len(cascading_scenarios)
    }


def trace_function_impact(failure: FailureMode, graph: UniversalGraph) -> List[str]:
    """
    Trace which functions are affected by a failure.
    
    Args:
        failure: FailureMode instance
        graph: UniversalGraph instance
        
    Returns:
        List of affected function IDs
    """
    affected = set(failure.affects_functions)
    
    # Also include functions performed by affected forms
    for form_id in failure.affects_forms:
        if form_id in graph.graph:
            for neighbor in graph.graph.neighbors(form_id):
                if neighbor in graph.functions:
                    affected.add(neighbor)
    
    return list(affected)


def trace_form_impact(failure: FailureMode, graph: UniversalGraph) -> List[str]:
    """
    Trace which form elements are affected by a failure.
    
    Args:
        failure: FailureMode instance
        graph: UniversalGraph instance
        
    Returns:
        List of affected form element IDs
    """
    affected = set(failure.affects_forms)
    
    # Also include forms that perform affected functions
    for func_id in failure.affects_functions:
        if func_id in graph.graph:
            for predecessor in graph.graph.predecessors(func_id):
                if predecessor in graph.form_elements:
                    affected.add(predecessor)
    
    return list(affected)


def _find_reachable_failures(failure_id: str, graph: UniversalGraph, max_depth: int = 5) -> List[str]:
    """
    Find all failures reachable from a given failure.
    
    Args:
        failure_id: Starting failure ID
        graph: UniversalGraph instance
        max_depth: Maximum propagation depth
        
    Returns:
        List of reachable failure IDs
    """
    reachable = []
    visited = set()
    
    def dfs(current_id: str, depth: int):
        if depth > max_depth or current_id in visited:
            return
        
        visited.add(current_id)
        
        if current_id in graph.failure_modes:
            failure = graph.failure_modes[current_id]
            for next_id in failure.propagates_to:
                if next_id not in visited:
                    reachable.append(next_id)
                    dfs(next_id, depth + 1)
    
    dfs(failure_id, 0)
    
    return reachable


def _compute_propagation_probability(source_id: str, targets: List[str], graph: UniversalGraph) -> float:
    """
    Compute overall propagation probability.
    
    Args:
        source_id: Source failure ID
        targets: List of target failure IDs
        graph: UniversalGraph instance
        
    Returns:
        Propagation probability
    """
    if not targets:
        return 0.0
    
    # Average probability of reaching any target
    total_prob = 0.0
    
    for branch in graph.failure_branches:
        if branch.source_failure.id == source_id and branch.target_failure.id in targets:
            total_prob += branch.propagation_probability
    
    return min(total_prob / len(targets), 1.0) if targets else 0.0


def _compute_failure_cascade(failure_id: str, graph: UniversalGraph) -> List[str]:
    """
    Compute full failure cascade.
    
    Args:
        failure_id: Starting failure ID
        graph: UniversalGraph instance
        
    Returns:
        List of all failures in cascade (including source)
    """
    cascade = [failure_id]
    visited = {failure_id}
    queue = [failure_id]
    
    while queue:
        current = queue.pop(0)
        
        if current in graph.failure_modes:
            for next_id in graph.failure_modes[current].propagates_to:
                if next_id not in visited:
                    visited.add(next_id)
                    cascade.append(next_id)
                    queue.append(next_id)
    
    return cascade


def _compute_cascade_probability(source_id: str, cascade: List[str], graph: UniversalGraph) -> float:
    """
    Compute probability of cascade occurring.
    
    Args:
        source_id: Source failure ID
        cascade: List of failures in cascade
        graph: UniversalGraph instance
        
    Returns:
        Cascade probability
    """
    # Multiply probabilities along the path
    probability = 1.0
    
    if source_id in graph.failure_modes:
        probability *= graph.failure_modes[source_id].probability
    
    # Average propagation probabilities
    propagation_probs = []
    for branch in graph.failure_branches:
        if branch.source_failure.id in cascade and branch.target_failure.id in cascade:
            propagation_probs.append(branch.propagation_probability)
    
    if propagation_probs:
        avg_propagation = sum(propagation_probs) / len(propagation_probs)
        probability *= avg_propagation
    
    return probability


def _compute_cascade_severity(cascade: List[str], graph: UniversalGraph) -> float:
    """
    Compute overall severity of cascade.
    
    Args:
        cascade: List of failure IDs in cascade
        graph: UniversalGraph instance
        
    Returns:
        Aggregate severity score
    """
    total_severity = 0.0
    
    for failure_id in cascade:
        if failure_id in graph.failure_modes:
            total_severity += graph.failure_modes[failure_id].severity
    
    return total_severity / len(cascade) if cascade else 0.0
