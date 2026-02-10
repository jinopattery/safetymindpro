"""
Domain API Router

Provides REST API endpoints for domain management and operations.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.domains.registry import registry
from backend.core.graph import Graph, NodeData, EdgeData

router = APIRouter(prefix="/api/v1/domains", tags=["domains"])


class DomainInfoResponse(BaseModel):
    """Domain information response"""
    name: str
    display_name: str
    description: str
    node_types: List[Dict[str, Any]]
    edge_types: List[Dict[str, Any]]
    algorithms: List[Dict[str, str]]
    export_formats: List[str]


class StylingResponse(BaseModel):
    """Styling configuration response"""
    node_styles: Dict[str, Dict[str, Any]]
    edge_styles: Dict[str, Dict[str, Any]]
    theme: Dict[str, Any]


class AlgorithmRunRequest(BaseModel):
    """Request to run an algorithm"""
    domain: str
    algorithm_name: str
    graph_data: Dict[str, Any]
    params: Optional[Dict[str, Any]] = None


class AlgorithmRunResponse(BaseModel):
    """Response from running an algorithm"""
    success: bool
    results: Dict[str, Any]
    updated_graph: Dict[str, Any]
    error: Optional[str] = None


@router.get("/", response_model=List[str])
async def list_domains():
    """
    List all registered domain names
    
    Returns:
        List of domain names
    """
    return registry.list_domains()


@router.get("/info", response_model=List[DomainInfoResponse])
async def get_all_domains_info():
    """
    Get information about all registered domains
    
    Returns:
        List of domain information
    """
    return registry.get_all_domain_info()


@router.get("/{domain_name}/info", response_model=DomainInfoResponse)
async def get_domain_info(domain_name: str):
    """
    Get information about a specific domain
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        Domain information
        
    Raises:
        HTTPException: If domain not found
    """
    info = registry.get_domain_info(domain_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_name}' not found")
    return info


@router.get("/{domain_name}/styling", response_model=StylingResponse)
async def get_domain_styling(domain_name: str):
    """
    Get styling configuration for a domain
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        Styling configuration
        
    Raises:
        HTTPException: If domain not found
    """
    config = registry.get_styling_config(domain_name)
    if not config:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_name}' not found")
    
    return {
        "node_styles": config.node_styles,
        "edge_styles": config.edge_styles,
        "theme": config.theme
    }


@router.get("/{domain_name}/algorithms")
async def list_domain_algorithms(domain_name: str):
    """
    List all algorithms available for a domain
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        List of algorithm information
        
    Raises:
        HTTPException: If domain not found
    """
    adapter = registry.get(domain_name)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_name}' not found")
    
    algorithms = adapter.get_algorithms()
    return [
        {
            "name": algo.name,
            "description": algo.description
        }
        for algo in algorithms
    ]


@router.post("/run-algorithm", response_model=AlgorithmRunResponse)
async def run_domain_algorithm(request: AlgorithmRunRequest):
    """
    Run a domain-specific algorithm on a graph
    
    Args:
        request: Algorithm run request containing domain, algorithm name, graph data, and params
        
    Returns:
        Algorithm results and updated graph
        
    Raises:
        HTTPException: If domain or algorithm not found, or execution fails
    """
    # Get domain adapter
    adapter = registry.get(request.domain)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Domain '{request.domain}' not found")
    
    # Find algorithm
    algorithms = adapter.get_algorithms()
    algorithm = None
    for algo in algorithms:
        if algo.name == request.algorithm_name:
            algorithm = algo
            break
    
    if not algorithm:
        raise HTTPException(
            status_code=404,
            detail=f"Algorithm '{request.algorithm_name}' not found in domain '{request.domain}'"
        )
    
    try:
        # Reconstruct graph from data
        graph = Graph.from_dict(request.graph_data)
        
        # Run algorithm
        results = algorithm.run(graph, request.params)
        
        # Return results and updated graph
        return {
            "success": True,
            "results": results,
            "updated_graph": graph.to_dict(),
            "error": None
        }
    
    except Exception as e:
        return {
            "success": False,
            "results": {},
            "updated_graph": request.graph_data,
            "error": str(e)
        }


@router.post("/{domain_name}/validate-node")
async def validate_node(domain_name: str, node_data: Dict[str, Any]):
    """
    Validate a node against domain rules
    
    Args:
        domain_name: Name of the domain
        node_data: Node data to validate
        
    Returns:
        Validation result
        
    Raises:
        HTTPException: If domain not found
    """
    is_valid = registry.validate_node(domain_name, node_data)
    return {
        "valid": is_valid,
        "domain": domain_name
    }


@router.post("/{domain_name}/validate-edge")
async def validate_edge(domain_name: str, edge_data: Dict[str, Any]):
    """
    Validate an edge against domain rules
    
    Args:
        domain_name: Name of the domain
        edge_data: Edge data to validate
        
    Returns:
        Validation result
        
    Raises:
        HTTPException: If domain not found
    """
    is_valid = registry.validate_edge(domain_name, edge_data)
    return {
        "valid": is_valid,
        "domain": domain_name
    }


@router.get("/{domain_name}/schema")
async def get_domain_schema(domain_name: str):
    """
    Get JSON schema for a domain
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        JSON schema
        
    Raises:
        HTTPException: If domain not found
    """
    adapter = registry.get(domain_name)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_name}' not found")
    
    return adapter.get_schema()


@router.post("/{domain_name}/enrich-node")
async def enrich_node(domain_name: str, node: Dict[str, Any]):
    """
    Enrich a node with domain-specific computed attributes
    
    Args:
        domain_name: Name of the domain
        node: Node data
        
    Returns:
        Enriched node
        
    Raises:
        HTTPException: If domain not found
    """
    adapter = registry.get(domain_name)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_name}' not found")
    
    node_data = NodeData(**node)
    enriched = adapter.enrich_node(node_data)
    
    return enriched.dict()
