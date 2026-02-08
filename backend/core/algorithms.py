"""
Graph algorithms for network analysis
"""
from typing import Dict, List, Any, Optional
import networkx as nx
from backend.core.graph import Graph


class GraphAlgorithms:
    """Collection of graph analysis algorithms"""
    
    @staticmethod
    def shortest_path(graph: Graph, source: str, target: str) -> Optional[List[str]]:
        """Find shortest path between two nodes
        
        Args:
            graph: Graph instance
            source: Source node ID
            target: Target node ID
            
        Returns:
            List of node IDs in path or None
        """
        try:
            return nx.shortest_path(graph.graph, source, target)
        except nx.NetworkXNoPath:
            return None
    
    @staticmethod
    def centrality_measures(graph: Graph) -> Dict[str, Dict[str, float]]:
        """Calculate various centrality measures
        
        Args:
            graph: Graph instance
            
        Returns:
            Dictionary of centrality measures
        """
        return {
            'degree': dict(nx.degree_centrality(graph.graph)),
            'betweenness': dict(nx.betweenness_centrality(graph.graph)),
            'closeness': dict(nx.closeness_centrality(graph.graph)),
            'eigenvector': dict(nx.eigenvector_centrality(graph.graph, max_iter=100))
        }
    
    @staticmethod
    def find_cycles(graph: Graph) -> List[List[str]]:
        """Find all cycles in the graph
        
        Args:
            graph: Graph instance
            
        Returns:
            List of cycles (each cycle is a list of node IDs)
        """
        try:
            return list(nx.simple_cycles(graph.graph))
        except:
            return []
    
    @staticmethod
    def critical_nodes(graph: Graph, top_n: int = 5) -> List[Dict[str, Any]]:
        """Identify critical nodes based on centrality
        
        Args:
            graph: Graph instance
            top_n: Number of top nodes to return
            
        Returns:
            List of critical nodes with scores
        """
        centrality = nx.betweenness_centrality(graph.graph)
        sorted_nodes = sorted(
            centrality.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]
        
        return [
            {
                'node_id': node_id,
                'score': score,
                'data': graph.get_node(node_id)
            }
            for node_id, score in sorted_nodes
        ]
    
    @staticmethod
    def failure_propagation_paths(
        graph: Graph,
        failure_node: str,
        max_depth: int = 5
    ) -> List[List[str]]:
        """Find all paths from a failure node within max depth
        
        Args:
            graph: Graph instance
            failure_node: Starting failure node ID
            max_depth: Maximum path depth
            
        Returns:
            List of propagation paths
        """
        paths = []
        
        def dfs_paths(current: str, path: List[str], depth: int):
            if depth > max_depth:
                return
            
            for neighbor in graph.get_neighbors(current):
                if neighbor not in path:  # Avoid cycles
                    new_path = path + [neighbor]
                    paths.append(new_path)
                    dfs_paths(neighbor, new_path, depth + 1)
        
        dfs_paths(failure_node, [failure_node], 0)
        return paths
    
    @staticmethod
    def connected_components(graph: Graph) -> List[List[str]]:
        """Find connected components
        
        Args:
            graph: Graph instance
            
        Returns:
            List of components (each is a list of node IDs)
        """
        if graph.graph.is_directed():
            components = nx.weakly_connected_components(graph.graph)
        else:
            components = nx.connected_components(graph.graph)
        
        return [list(component) for component in components]