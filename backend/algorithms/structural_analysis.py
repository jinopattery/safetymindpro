"""
Structural Analysis - Form-Centric Algorithms

Domain-independent structural analysis algorithms that work on the form layer
of the universal graph. These algorithms analyze physical/logical structure
and identify critical components.
"""

from typing import Dict, List, Any, Tuple
import networkx as nx
from backend.core.universal_graph import UniversalGraph, FormElement


def compute_criticality(graph: UniversalGraph) -> Dict[str, float]:
    """
    Compute criticality scores for form elements.
    
    Works for ANY domain by analyzing:
    - Structural centrality (how connected)
    - Function dependencies (what functions it performs)
    - Failure impacts (what failures affect it)
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary mapping form element IDs to criticality scores (0.0-1.0)
    """
    criticality_scores = {}
    
    if not graph.form_elements:
        return criticality_scores
    
    # 1. Form-centric centrality
    form_centrality = _compute_form_centrality(graph)
    
    # 2. Function flow analysis
    function_flows = _analyze_function_dependencies(graph)
    
    # 3. Failure impact analysis
    failure_impacts = _compute_failure_propagation_impact(graph)
    
    # Combine metrics with weights
    for form_id in graph.form_elements:
        score = (
            form_centrality.get(form_id, 0.0) * 0.3 +
            function_flows.get(form_id, 0.0) * 0.4 +
            failure_impacts.get(form_id, 0.0) * 0.3
        )
        criticality_scores[form_id] = score
    
    # Normalize to 0-1 range
    if criticality_scores:
        max_score = max(criticality_scores.values())
        if max_score > 0:
            criticality_scores = {
                fid: score / max_score
                for fid, score in criticality_scores.items()
            }
    
    return criticality_scores


def analyze_structure(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Comprehensive structural analysis.
    
    Returns multiple metrics including:
    - Criticality scores
    - Centrality measures
    - Bottleneck identification
    - Component clusters
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary with structural analysis results
    """
    return {
        'criticality_scores': compute_criticality(graph),
        'centrality_measures': _compute_all_centrality_measures(graph),
        'bottlenecks': _identify_structural_bottlenecks(graph),
        'clusters': _identify_component_clusters(graph),
        'connectivity': _analyze_connectivity(graph)
    }


def _compute_form_centrality(graph: UniversalGraph) -> Dict[str, float]:
    """
    Compute centrality measures for form elements only.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary mapping form IDs to centrality scores
    """
    # Create subgraph with only form elements
    form_nodes = list(graph.form_elements.keys())
    
    if not form_nodes:
        return {}
    
    # Use betweenness centrality as primary measure
    try:
        centrality = nx.betweenness_centrality(graph.graph)
        return {
            fid: centrality.get(fid, 0.0)
            for fid in form_nodes
        }
    except:
        # If graph is empty or has issues, return zeros
        return {fid: 0.0 for fid in form_nodes}


def _analyze_function_dependencies(graph: UniversalGraph) -> Dict[str, float]:
    """
    Analyze function dependencies for each form element.
    
    Higher score = performs more critical functions
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary mapping form IDs to function dependency scores
    """
    scores = {fid: 0.0 for fid in graph.form_elements}
    
    # Count functions performed by each form element
    for form_id in graph.form_elements:
        function_count = 0
        
        # Check edges from form to functions
        if form_id in graph.graph:
            for neighbor in graph.graph.neighbors(form_id):
                if neighbor in graph.functions:
                    function_count += 1
        
        # Weight by number of functions and their descendants
        for func_id in graph.functions:
            if form_id in graph.graph and func_id in graph.graph.neighbors(form_id):
                func = graph.functions[func_id]
                # More critical if function has many dependencies
                descendants = func.get_descendants()
                scores[form_id] += 1.0 + len(descendants) * 0.1
    
    return scores


def _compute_failure_propagation_impact(graph: UniversalGraph) -> Dict[str, float]:
    """
    Compute failure impact for each form element.
    
    Higher score = more failures affect this form or propagate from it
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary mapping form IDs to failure impact scores
    """
    scores = {fid: 0.0 for fid in graph.form_elements}
    
    for form_id in graph.form_elements:
        impact = 0.0
        
        # Count failures affecting this form
        for failure in graph.failure_modes.values():
            if form_id in failure.affects_forms:
                # Weight by severity and probability
                risk = failure.severity * failure.probability
                impact += risk
        
        scores[form_id] = impact
    
    return scores


def _compute_all_centrality_measures(graph: UniversalGraph) -> Dict[str, Dict[str, float]]:
    """
    Compute multiple centrality measures.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary of centrality measures
    """
    form_nodes = list(graph.form_elements.keys())
    
    if not form_nodes or graph.graph.number_of_nodes() == 0:
        return {
            'degree': {},
            'betweenness': {},
            'closeness': {}
        }
    
    try:
        return {
            'degree': {
                fid: graph.graph.degree(fid) / max(1, graph.graph.number_of_nodes() - 1)
                for fid in form_nodes
            },
            'betweenness': {
                fid: nx.betweenness_centrality(graph.graph).get(fid, 0.0)
                for fid in form_nodes
            },
            'closeness': {
                fid: nx.closeness_centrality(graph.graph).get(fid, 0.0)
                for fid in form_nodes if fid in graph.graph
            }
        }
    except:
        return {
            'degree': {fid: 0.0 for fid in form_nodes},
            'betweenness': {fid: 0.0 for fid in form_nodes},
            'closeness': {fid: 0.0 for fid in form_nodes}
        }


def _identify_structural_bottlenecks(graph: UniversalGraph, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Identify structural bottlenecks.
    
    Bottleneck = high betweenness centrality (many paths go through it)
    
    Args:
        graph: UniversalGraph instance
        top_n: Number of top bottlenecks to return
        
    Returns:
        List of bottleneck information
    """
    if not graph.form_elements:
        return []
    
    try:
        centrality = nx.betweenness_centrality(graph.graph)
        
        # Filter to form elements only
        form_centrality = {
            fid: centrality.get(fid, 0.0)
            for fid in graph.form_elements
        }
        
        # Sort by centrality
        sorted_forms = sorted(
            form_centrality.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]
        
        return [
            {
                'form_id': fid,
                'form_type': graph.form_elements[fid].type,
                'bottleneck_score': score,
                'is_critical': score > 0.1
            }
            for fid, score in sorted_forms if score > 0
        ]
    except:
        return []


def _identify_component_clusters(graph: UniversalGraph) -> List[List[str]]:
    """
    Identify clusters of related form elements.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        List of clusters (each cluster is a list of form IDs)
    """
    if not graph.form_elements:
        return []
    
    try:
        # Use community detection or connected components
        if graph.graph.is_directed():
            components = nx.weakly_connected_components(graph.graph)
        else:
            components = nx.connected_components(graph.graph)
        
        # Filter to include only form elements
        clusters = []
        for component in components:
            form_cluster = [nid for nid in component if nid in graph.form_elements]
            if len(form_cluster) > 1:  # Only include clusters with multiple elements
                clusters.append(form_cluster)
        
        return clusters
    except:
        return []


def _analyze_connectivity(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze graph connectivity.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary with connectivity metrics
    """
    form_count = len(graph.form_elements)
    
    if form_count == 0:
        return {
            'is_connected': False,
            'num_components': 0,
            'density': 0.0,
            'average_degree': 0.0
        }
    
    try:
        if graph.graph.is_directed():
            is_connected = nx.is_weakly_connected(graph.graph)
            num_components = nx.number_weakly_connected_components(graph.graph)
        else:
            is_connected = nx.is_connected(graph.graph)
            num_components = nx.number_connected_components(graph.graph)
        
        density = nx.density(graph.graph)
        avg_degree = sum(dict(graph.graph.degree()).values()) / max(1, graph.graph.number_of_nodes())
        
        return {
            'is_connected': is_connected,
            'num_components': num_components,
            'density': density,
            'average_degree': avg_degree
        }
    except:
        return {
            'is_connected': False,
            'num_components': 0,
            'density': 0.0,
            'average_degree': 0.0
        }
