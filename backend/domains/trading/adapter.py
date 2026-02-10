"""
Trading Domain Adapter

Implements the DomainAdapter interface for stock trading and portfolio analysis.
"""

from typing import Dict, List, Any, Optional
from backend.domains.base import (
    DomainAdapter, DomainNodeType, DomainEdgeType,
    DomainAlgorithm, StylingConfig
)
from backend.core.graph import NodeData, EdgeData, Graph
from backend.domains.trading.models import (
    Asset, Position, Portfolio, Correlation,
    AssetType, PositionType, RiskCategory, CorrelationType
)
import networkx as nx
from collections import defaultdict


class CorrelationAnalysis(DomainAlgorithm):
    """Analyzes correlations and dependencies between assets"""
    
    @property
    def name(self) -> str:
        return "correlation_analysis"
    
    @property
    def description(self) -> str:
        return "Identifies correlated assets and potential concentration risks"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze asset correlations"""
        correlation_threshold = params.get('correlation_threshold', 0.7) if params else 0.7
        
        correlations = []
        asset_clusters = []
        
        # Extract correlation edges
        for source, target, edge_data in graph.graph.edges(data=True):
            if edge_data.get('type') == 'correlation':
                coef = edge_data.get('attributes', {}).get('correlation_coefficient', 0)
                
                if abs(coef) >= correlation_threshold:
                    source_data = graph.graph.nodes[source]
                    target_data = graph.graph.nodes[target]
                    
                    correlations.append({
                        'asset1': source_data.get('label', source),
                        'asset2': target_data.get('label', target),
                        'coefficient': coef,
                        'strength': 'strong' if abs(coef) >= 0.8 else 'moderate'
                    })
                    
                    # Mark nodes as correlated
                    if 'high_correlation_count' not in graph.graph.nodes[source]['attributes']:
                        graph.graph.nodes[source]['attributes']['high_correlation_count'] = 0
                    if 'high_correlation_count' not in graph.graph.nodes[target]['attributes']:
                        graph.graph.nodes[target]['attributes']['high_correlation_count'] = 0
                    
                    graph.graph.nodes[source]['attributes']['high_correlation_count'] += 1
                    graph.graph.nodes[target]['attributes']['high_correlation_count'] += 1
        
        # Find clusters of highly correlated assets
        # Use connected components on high-correlation edges
        high_corr_graph = nx.Graph()
        for source, target, edge_data in graph.graph.edges(data=True):
            if edge_data.get('type') == 'correlation':
                coef = edge_data.get('attributes', {}).get('correlation_coefficient', 0)
                if abs(coef) >= correlation_threshold:
                    high_corr_graph.add_edge(source, target)
        
        if high_corr_graph.number_of_nodes() > 0:
            components = nx.connected_components(high_corr_graph)
            for i, component in enumerate(components):
                if len(component) >= 3:  # Cluster of 3+ assets
                    cluster_nodes = list(component)
                    cluster_labels = [
                        graph.graph.nodes[n].get('label', n) 
                        for n in cluster_nodes
                    ]
                    asset_clusters.append({
                        'cluster_id': i,
                        'size': len(component),
                        'assets': cluster_labels,
                        'concentration_risk': 'high' if len(component) >= 5 else 'moderate'
                    })
        
        return {
            'high_correlations': sorted(correlations, key=lambda x: abs(x['coefficient']), reverse=True),
            'total_high_correlations': len(correlations),
            'asset_clusters': asset_clusters,
            'concentration_risk': len(asset_clusters) > 0
        }


class PortfolioRiskAssessment(DomainAlgorithm):
    """Assesses portfolio risk and diversification"""
    
    @property
    def name(self) -> str:
        return "portfolio_risk"
    
    @property
    def description(self) -> str:
        return "Evaluates portfolio risk, diversification, and exposure"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Assess portfolio risk"""
        
        portfolio_assessments = []
        
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'portfolio':
                attrs = node_data.get('attributes', {})
                
                # Calculate concentration
                positions_count = len(attrs.get('positions', []))
                
                # Count asset types through holdings
                asset_types = set()
                sectors = set()
                
                # Find connected positions
                for neighbor in graph.graph.neighbors(node_id):
                    neighbor_data = graph.graph.nodes[neighbor]
                    if neighbor_data.get('type') == 'position':
                        # Find asset connected to this position
                        for asset_neighbor in graph.graph.neighbors(neighbor):
                            asset_data = graph.graph.nodes[asset_neighbor]
                            if asset_data.get('type') == 'asset':
                                asset_attrs = asset_data.get('attributes', {})
                                asset_types.add(asset_attrs.get('asset_type', 'unknown'))
                                sector = asset_attrs.get('sector')
                                if sector:
                                    sectors.add(sector)
                
                # Calculate diversification score
                diversification_score = 0
                
                # Factor 1: Number of positions
                if positions_count >= 20:
                    diversification_score += 40
                elif positions_count >= 10:
                    diversification_score += 30
                elif positions_count >= 5:
                    diversification_score += 20
                else:
                    diversification_score += 10
                
                # Factor 2: Asset type diversity
                diversification_score += min(30, len(asset_types) * 10)
                
                # Factor 3: Sector diversity
                diversification_score += min(30, len(sectors) * 5)
                
                # Risk assessment
                beta = attrs.get('portfolio_beta', 1.0)
                risk_score = 0
                
                if beta > 1.5:
                    risk_score = 80  # High risk
                elif beta > 1.2:
                    risk_score = 60  # Moderate-high
                elif beta > 0.8:
                    risk_score = 40  # Moderate
                else:
                    risk_score = 20  # Low risk
                
                # Adjust risk based on diversification
                adjusted_risk = risk_score * (1 - (diversification_score / 200))
                
                # Update node
                graph.graph.nodes[node_id]['attributes']['diversification_score'] = diversification_score
                graph.graph.nodes[node_id]['attributes']['risk_score'] = adjusted_risk
                graph.graph.nodes[node_id]['attributes']['asset_type_count'] = len(asset_types)
                graph.graph.nodes[node_id]['attributes']['sector_count'] = len(sectors)
                
                portfolio_assessments.append({
                    'portfolio_id': node_id,
                    'portfolio_name': node_data.get('label', 'unknown'),
                    'positions_count': positions_count,
                    'diversification_score': diversification_score,
                    'risk_score': adjusted_risk,
                    'beta': beta,
                    'asset_types': len(asset_types),
                    'sectors': len(sectors),
                    'risk_level': (
                        'high' if adjusted_risk >= 60 else
                        'moderate' if adjusted_risk >= 40 else
                        'low'
                    )
                })
        
        return {
            'portfolio_assessments': sorted(portfolio_assessments, key=lambda x: x['risk_score'], reverse=True),
            'total_portfolios': len(portfolio_assessments),
            'high_risk_portfolios': len([p for p in portfolio_assessments if p['risk_score'] >= 60]),
            'average_diversification': (
                sum(p['diversification_score'] for p in portfolio_assessments) / len(portfolio_assessments)
                if portfolio_assessments else 0
            )
        }


class DependencyPropagation(DomainAlgorithm):
    """Analyzes how market shocks propagate through dependencies"""
    
    @property
    def name(self) -> str:
        return "dependency_propagation"
    
    @property
    def description(self) -> str:
        return "Simulates how price movements propagate through correlated assets"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze dependency propagation"""
        max_depth = params.get('max_depth', 4) if params else 4
        
        propagation_paths = []
        systemic_risks = []
        
        # Find assets with high volatility or significant events
        shock_sources = []
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'asset':
                attrs = node_data.get('attributes', {})
                volatility = attrs.get('volatility', 0)
                
                if volatility > 0.3:  # High volatility
                    shock_sources.append(node_id)
        
        # For each potential shock source, trace propagation
        for source in shock_sources:
            try:
                # Find all reachable assets through correlation edges
                reachable = set()
                
                def dfs_propagate(node, depth):
                    if depth > max_depth:
                        return
                    
                    for neighbor in graph.graph.neighbors(node):
                        edge_data = graph.graph.edges.get((node, neighbor)) or graph.graph.edges.get((neighbor, node))
                        if edge_data and edge_data.get('type') == 'correlation':
                            correlation = edge_data.get('attributes', {}).get('correlation_coefficient', 0)
                            
                            if abs(correlation) > 0.5 and neighbor not in reachable:
                                reachable.add(neighbor)
                                
                                # Mark node as at risk
                                if 'propagation_sources' not in graph.graph.nodes[neighbor]['attributes']:
                                    graph.graph.nodes[neighbor]['attributes']['propagation_sources'] = []
                                graph.graph.nodes[neighbor]['attributes']['propagation_sources'].append({
                                    'source': source,
                                    'depth': depth,
                                    'correlation': correlation
                                })
                                
                                dfs_propagate(neighbor, depth + 1)
                
                dfs_propagate(source, 0)
                
                if len(reachable) >= 5:  # Significant propagation
                    source_data = graph.graph.nodes[source]
                    propagation_paths.append({
                        'source_asset': source_data.get('label', source),
                        'affected_count': len(reachable),
                        'systemic_risk': 'high' if len(reachable) >= 10 else 'moderate'
                    })
            except:
                pass
        
        # Identify systemic risk nodes (highly connected)
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'asset':
                # Count high-correlation connections
                high_corr_neighbors = 0
                for neighbor in graph.graph.neighbors(node_id):
                    edge_data = graph.graph.edges.get((node_id, neighbor)) or graph.graph.edges.get((neighbor, node_id))
                    if edge_data and edge_data.get('type') == 'correlation':
                        correlation = edge_data.get('attributes', {}).get('correlation_coefficient', 0)
                        if abs(correlation) > 0.7:
                            high_corr_neighbors += 1
                
                if high_corr_neighbors >= 5:
                    graph.graph.nodes[node_id]['attributes']['systemic_risk_node'] = True
                    graph.graph.nodes[node_id]['attributes']['correlation_degree'] = high_corr_neighbors
                    
                    systemic_risks.append({
                        'asset': node_data.get('label', node_id),
                        'correlation_connections': high_corr_neighbors,
                        'risk_level': 'critical' if high_corr_neighbors >= 10 else 'high'
                    })
        
        return {
            'propagation_paths': sorted(propagation_paths, key=lambda x: x['affected_count'], reverse=True),
            'systemic_risk_nodes': sorted(systemic_risks, key=lambda x: x['correlation_connections'], reverse=True),
            'total_propagations': len(propagation_paths),
            'systemic_risk_present': len(systemic_risks) > 0
        }


class TradingDomain(DomainAdapter):
    """
    Trading domain adapter for stock market and portfolio analysis.
    
    Supports asset networks, portfolio risk assessment, and dependency analysis.
    """
    
    @property
    def domain_name(self) -> str:
        return "trading"
    
    @property
    def domain_display_name(self) -> str:
        return "Trading & Markets"
    
    @property
    def description(self) -> str:
        return "Stock trading, portfolio analysis, and market dependency networks"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            DomainNodeType(
                name="asset",
                display_name="Asset",
                icon="📈",
                description="Tradable asset (stock, bond, ETF, etc.)",
                default_attributes={
                    "asset_type": "stock",
                    "current_price": 0.0,
                    "beta": 1.0,
                    "volatility": 0.0
                }
            ),
            DomainNodeType(
                name="portfolio",
                display_name="Portfolio",
                icon="💼",
                description="Investment portfolio",
                default_attributes={
                    "total_value": 0.0,
                    "risk_category": "moderate",
                    "portfolio_beta": 1.0
                }
            ),
            DomainNodeType(
                name="position",
                display_name="Position",
                icon="📊",
                description="Trading position in an asset",
                default_attributes={
                    "position_type": "long",
                    "shares": 0.0,
                    "unrealized_pnl": 0.0
                }
            ),
            DomainNodeType(
                name="market_event",
                display_name="Market Event",
                icon="⚡",
                description="Significant market event",
                default_attributes={
                    "severity": 5,
                    "market_impact": "neutral"
                }
            )
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            DomainEdgeType(
                name="correlation",
                display_name="Correlation",
                description="Statistical correlation between assets",
                directed=False,
                default_attributes={
                    "correlation_coefficient": 0.0,
                    "correlation_type": "neutral"
                }
            ),
            DomainEdgeType(
                name="holding",
                display_name="Holding",
                description="Portfolio holds position",
                directed=True,
                default_attributes={
                    "allocation_pct": 0.0
                }
            ),
            DomainEdgeType(
                name="dependency",
                display_name="Dependency",
                description="Asset dependency relationship",
                directed=True,
                default_attributes={
                    "dependency_strength": "medium"
                }
            ),
            DomainEdgeType(
                name="impact",
                display_name="Event Impact",
                description="Market event impacts asset",
                directed=True,
                default_attributes={
                    "impact_magnitude": 0.0
                }
            )
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                "asset": {
                    "shape": "hexagon",
                    "backgroundColor": "#3498db",
                    "color": "#ffffff",
                    "borderColor": "#2980b9",
                    "borderWidth": 2,
                    "fontSize": 13,
                    "padding": 12,
                    "borderRadius": 4
                },
                "portfolio": {
                    "shape": "rectangle",
                    "backgroundColor": "#9b59b6",
                    "color": "#ffffff",
                    "borderColor": "#8e44ad",
                    "borderWidth": 3,
                    "fontSize": 14,
                    "padding": 15,
                    "borderRadius": 8
                },
                "position": {
                    "shape": "diamond",
                    "backgroundColor": "#16a085",
                    "color": "#ffffff",
                    "borderColor": "#1abc9c",
                    "borderWidth": 2,
                    "fontSize": 11,
                    "padding": 8
                },
                "market_event": {
                    "shape": "star",
                    "backgroundColor": "#e67e22",
                    "color": "#ffffff",
                    "borderColor": "#d35400",
                    "borderWidth": 2,
                    "fontSize": 12,
                    "padding": 10
                }
            },
            edge_styles={
                "correlation": {
                    "stroke": "#95a5a6",
                    "strokeWidth": 2,
                    "type": "straight",
                    "strokeDasharray": "5,5"
                },
                "holding": {
                    "stroke": "#9b59b6",
                    "strokeWidth": 2,
                    "animated": False,
                    "type": "smoothstep",
                    "arrowSize": 7
                },
                "dependency": {
                    "stroke": "#e67e22",
                    "strokeWidth": 2.5,
                    "animated": True,
                    "type": "step",
                    "arrowSize": 8
                },
                "impact": {
                    "stroke": "#e74c3c",
                    "strokeWidth": 3,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 9,
                    "strokeDasharray": "8,4"
                }
            },
            theme={
                "name": "Trading",
                "primaryColor": "#3498db",
                "dangerColor": "#e74c3c",
                "successColor": "#27ae60",
                "warningColor": "#f39c12",
                "backgroundColor": "#2c3e50",
                "gridColor": "#34495e"
            }
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            CorrelationAnalysis(),
            PortfolioRiskAssessment(),
            DependencyPropagation()
        ]
    
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate trading node"""
        node_type = node_data.get('type')
        
        valid_types = [nt.name for nt in self.get_node_types()]
        if node_type not in valid_types:
            return False
        
        if node_type == 'asset':
            attrs = node_data.get('attributes', {})
            beta = attrs.get('beta', 1.0)
            if beta < 0:
                return False
        
        elif node_type == 'market_event':
            attrs = node_data.get('attributes', {})
            severity = attrs.get('severity', 5)
            if not (1 <= severity <= 10):
                return False
        
        return True
    
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate trading edge"""
        edge_type = edge_data.get('type')
        
        valid_types = [et.name for et in self.get_edge_types()]
        if edge_type not in valid_types:
            return False
        
        if edge_type == 'correlation':
            attrs = edge_data.get('attributes', {})
            coef = attrs.get('correlation_coefficient', 0)
            if not (-1.0 <= coef <= 1.0):
                return False
        
        elif edge_type == 'holding':
            attrs = edge_data.get('attributes', {})
            allocation = attrs.get('allocation_pct', 0)
            if not (0 <= allocation <= 100):
                return False
        
        return True
    
    def enrich_node(self, node: NodeData) -> NodeData:
        """Enrich trading node with calculated attributes"""
        if node.type == 'asset':
            attrs = node.attributes
            current_price = attrs.get('current_price', 0)
            previous_close = attrs.get('previous_close', 0)
            
            if previous_close > 0:
                change_pct = ((current_price - previous_close) / previous_close) * 100
                attrs['day_change_pct'] = change_pct
                attrs['trend'] = 'up' if change_pct > 0 else 'down' if change_pct < 0 else 'flat'
            
            # Risk category based on volatility
            volatility = attrs.get('volatility', 0)
            if volatility > 0.4:
                attrs['risk_category'] = 'high'
            elif volatility > 0.2:
                attrs['risk_category'] = 'moderate'
            else:
                attrs['risk_category'] = 'low'
        
        elif node.type == 'position':
            attrs = node.attributes
            shares = attrs.get('shares', 0)
            entry_price = attrs.get('entry_price', 0)
            current_price = attrs.get('current_price', 0)
            
            if shares and entry_price:
                unrealized_pnl = shares * (current_price - entry_price)
                attrs['unrealized_pnl'] = unrealized_pnl
                attrs['pnl_pct'] = ((current_price - entry_price) / entry_price) * 100 if entry_price > 0 else 0
        
        return node
    
    def get_export_formats(self) -> List[str]:
        return ['json', 'excel', 'csv', 'graphml']
