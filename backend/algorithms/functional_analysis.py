"""
Functional Analysis - Function-Centric Algorithms

Domain-independent functional analysis algorithms that work on the function layer
of the universal graph. These algorithms analyze behavioral structure and
identify performance bottlenecks.
"""

from typing import Dict, List, Any, Tuple, Set
import networkx as nx
from backend.core.universal_graph import UniversalGraph, Function


def analyze_function_tree(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze the function tree structure.
    
    Returns:
    - Function hierarchy
    - Bottlenecks
    - Redundancy
    - Critical paths
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary with function analysis results
    """
    return {
        'hierarchy': build_function_hierarchy(graph.functions),
        'bottlenecks': identify_function_bottlenecks(graph),
        'redundancy': compute_function_redundancy(graph),
        'critical_paths': find_critical_function_paths(graph),
        'performance_metrics': analyze_function_performance(graph)
    }


def build_function_hierarchy(functions: Dict[str, Function]) -> Dict[str, Any]:
    """
    Build hierarchical representation of functions.
    
    Args:
        functions: Dictionary of Function instances
        
    Returns:
        Hierarchical structure
    """
    # Find root functions (no parent)
    roots = [f for f in functions.values() if f.parent_function is None]
    
    def build_tree(func: Function) -> Dict[str, Any]:
        return {
            'id': func.id,
            'name': func.name,
            'inputs': func.inputs,
            'outputs': func.outputs,
            'children': [build_tree(child) for child in func.children]
        }
    
    return {
        'roots': [build_tree(root) for root in roots],
        'total_functions': len(functions),
        'max_depth': _compute_max_depth(functions)
    }


def identify_function_bottlenecks(graph: UniversalGraph, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Identify function bottlenecks.
    
    Bottleneck indicators:
    - High in-degree (many functions depend on it)
    - Low reliability on branches
    - High latency
    
    Args:
        graph: UniversalGraph instance
        top_n: Number of top bottlenecks to return
        
    Returns:
        List of bottleneck information
    """
    bottlenecks = []
    
    for func_id, func in graph.functions.items():
        # Calculate bottleneck score
        in_degree = 0
        out_degree = 0
        avg_reliability = 1.0
        avg_latency = 0.0
        
        # Count dependencies
        if func_id in graph.graph:
            in_degree = len(list(graph.graph.predecessors(func_id)))
            out_degree = len(list(graph.graph.successors(func_id)))
        
        # Analyze branches involving this function
        related_branches = [
            b for b in graph.function_branches
            if b.source_function.id == func_id or b.target_function.id == func_id
        ]
        
        if related_branches:
            avg_reliability = sum(b.reliability for b in related_branches) / len(related_branches)
            avg_latency = sum(b.latency for b in related_branches) / len(related_branches)
        
        # Compute bottleneck score
        # Higher score = bigger bottleneck
        bottleneck_score = (
            in_degree * 0.3 +
            (1.0 - avg_reliability) * 0.4 +
            min(avg_latency / 100.0, 1.0) * 0.3
        )
        
        if bottleneck_score > 0:
            bottlenecks.append({
                'function_id': func_id,
                'function_name': func.name,
                'bottleneck_score': bottleneck_score,
                'in_degree': in_degree,
                'out_degree': out_degree,
                'avg_reliability': avg_reliability,
                'avg_latency': avg_latency,
                'is_critical': bottleneck_score > 0.5
            })
    
    # Sort by bottleneck score
    bottlenecks.sort(key=lambda x: x['bottleneck_score'], reverse=True)
    
    return bottlenecks[:top_n]


def compute_function_redundancy(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze redundancy in function structure.
    
    Redundancy = multiple paths to achieve same output
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Dictionary with redundancy analysis
    """
    redundancy_info = {
        'redundant_paths': [],
        'single_points_of_failure': [],
        'redundancy_score': 0.0
    }
    
    if not graph.functions:
        return redundancy_info
    
    # Find functions with same outputs (potential redundancy)
    output_groups = {}
    for func_id, func in graph.functions.items():
        output_key = tuple(sorted(func.outputs))
        if output_key not in output_groups:
            output_groups[output_key] = []
        output_groups[output_key].append(func_id)
    
    # Identify redundant function groups
    for output_key, func_ids in output_groups.items():
        if len(func_ids) > 1 and output_key:  # More than one function with same outputs
            redundancy_info['redundant_paths'].append({
                'outputs': list(output_key),
                'functions': func_ids,
                'redundancy_level': len(func_ids)
            })
    
    # Identify single points of failure
    # Functions with no alternatives
    for func_id, func in graph.functions.items():
        output_key = tuple(sorted(func.outputs))
        if output_key and len(output_groups.get(output_key, [])) == 1:
            # No redundancy for this function
            redundancy_info['single_points_of_failure'].append({
                'function_id': func_id,
                'function_name': func.name,
                'outputs': func.outputs
            })
    
    # Compute overall redundancy score
    total_functions = len(graph.functions)
    redundant_functions = sum(len(group) for group in output_groups.values() if len(group) > 1)
    if total_functions > 0:
        redundancy_info['redundancy_score'] = redundant_functions / total_functions
    
    return redundancy_info


def find_critical_function_paths(graph: UniversalGraph) -> List[Dict[str, Any]]:
    """
    Find critical paths in the function tree.
    
    Critical path = longest path or path with lowest reliability
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        List of critical paths
    """
    critical_paths = []
    
    if not graph.functions:
        return critical_paths
    
    # Find root functions (no parent)
    roots = [f for f in graph.functions.values() if f.parent_function is None]
    
    # Find leaf functions (no children)
    leaves = [f for f in graph.functions.values() if not f.children]
    
    # Find paths from roots to leaves
    for root in roots:
        for leaf in leaves:
            try:
                if root.id in graph.graph and leaf.id in graph.graph:
                    paths = list(nx.all_simple_paths(graph.graph, root.id, leaf.id, cutoff=10))
                    
                    for path in paths:
                        # Calculate path metrics
                        path_length = len(path)
                        path_reliability = _compute_path_reliability(path, graph)
                        path_latency = _compute_path_latency(path, graph)
                        
                        critical_paths.append({
                            'path': path,
                            'length': path_length,
                            'reliability': path_reliability,
                            'latency': path_latency,
                            'criticality': (1.0 - path_reliability) * path_length
                        })
            except:
                continue
    
    # Sort by criticality
    critical_paths.sort(key=lambda x: x['criticality'], reverse=True)
    
    return critical_paths[:10]  # Return top 10


def analyze_function_performance(graph: UniversalGraph) -> Dict[str, Any]:
    """
    Analyze function performance metrics.
    
    Args:
        graph: UniversalGraph instance
        
    Returns:
        Performance analysis results
    """
    if not graph.functions:
        return {
            'avg_reliability': 1.0,
            'avg_latency': 0.0,
            'total_functions': 0
        }
    
    total_reliability = 0.0
    total_latency = 0.0
    count = 0
    
    for branch in graph.function_branches:
        total_reliability += branch.reliability
        total_latency += branch.latency
        count += 1
    
    return {
        'avg_reliability': total_reliability / count if count > 0 else 1.0,
        'avg_latency': total_latency / count if count > 0 else 0.0,
        'total_functions': len(graph.functions),
        'total_branches': len(graph.function_branches)
    }


def _compute_max_depth(functions: Dict[str, Function]) -> int:
    """
    Compute maximum depth of function tree.
    
    Args:
        functions: Dictionary of functions
        
    Returns:
        Maximum depth
    """
    max_depth = 0
    
    for func in functions.values():
        depth = len(func.get_ancestors())
        max_depth = max(max_depth, depth)
    
    return max_depth


def _compute_path_reliability(path: List[str], graph: UniversalGraph) -> float:
    """
    Compute reliability of a function path.
    
    Args:
        path: List of function IDs in path
        graph: UniversalGraph instance
        
    Returns:
        Overall path reliability (product of branch reliabilities)
    """
    reliability = 1.0
    
    for i in range(len(path) - 1):
        source = path[i]
        target = path[i + 1]
        
        # Find branch reliability
        for branch in graph.function_branches:
            if branch.source_function.id == source and branch.target_function.id == target:
                reliability *= branch.reliability
                break
    
    return reliability


def _compute_path_latency(path: List[str], graph: UniversalGraph) -> float:
    """
    Compute total latency of a function path.
    
    Args:
        path: List of function IDs in path
        graph: UniversalGraph instance
        
    Returns:
        Total path latency (sum of branch latencies)
    """
    latency = 0.0
    
    for i in range(len(path) - 1):
        source = path[i]
        target = path[i + 1]
        
        # Find branch latency
        for branch in graph.function_branches:
            if branch.source_function.id == source and branch.target_function.id == target:
                latency += branch.latency
                break
    
    return latency
