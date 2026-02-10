"""
Example: Trading Domain - Portfolio Risk Analysis

Demonstrates portfolio risk assessment and correlation analysis.
"""

from backend.domains import get_domain
from backend.core.graph import Graph, NodeData, EdgeData
import json


def create_portfolio_analysis_example():
    """
    Create a stock portfolio with correlations for risk analysis.
    """
    
    trading = get_domain("trading")
    if not trading:
        print("ERROR: Trading domain not registered!")
        return
    
    print("=" * 70)
    print("Trading Domain Example: Portfolio Risk Analysis")
    print("=" * 70)
    print()
    
    # Create graph
    graph = Graph(directed=False)  # Undirected for correlations
    
    # 1. Create Assets
    print("1. Creating market assets...")
    
    assets = [
        {"symbol": "AAPL", "name": "Apple Inc.", "price": 185.50, "prev": 183.20, "beta": 1.25, "volatility": 0.25, "sector": "Technology"},
        {"symbol": "MSFT", "name": "Microsoft Corp.", "price": 412.30, "prev": 410.50, "beta": 1.18, "volatility": 0.22, "sector": "Technology"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "price": 175.80, "prev": 174.20, "beta": 1.15, "volatility": 0.28, "sector": "Technology"},
        {"symbol": "JPM", "name": "JPMorgan Chase", "price": 215.60, "prev": 218.30, "beta": 1.05, "volatility": 0.18, "sector": "Finance"},
        {"symbol": "JNJ", "name": "Johnson & Johnson", "price": 161.20, "prev": 160.80, "beta": 0.65, "volatility": 0.12, "sector": "Healthcare"},
        {"symbol": "XOM", "name": "Exxon Mobil", "price": 118.40, "prev": 120.10, "beta": 0.95, "volatility": 0.30, "sector": "Energy"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "price": 243.80, "prev": 238.50, "beta": 1.95, "volatility": 0.58, "sector": "Automotive"},
    ]
    
    asset_nodes = {}
    for asset in assets:
        node = NodeData(
            type="asset",
            label=asset["symbol"],
            domain="trading",
            attributes={
                "symbol": asset["symbol"],
                "name": asset["name"],
                "asset_type": "stock",
                "current_price": asset["price"],
                "previous_close": asset["prev"],
                "beta": asset["beta"],
                "volatility": asset["volatility"],
                "sector": asset["sector"]
            }
        )
        enriched = trading.enrich_node(node)
        node_id = graph.add_node(enriched)
        asset_nodes[asset["symbol"]] = node_id
        
        change_pct = enriched.attributes.get('day_change_pct', 0)
        trend = enriched.attributes.get('trend', 'flat')
        risk = enriched.attributes.get('risk_category', 'unknown')
        
        print(f"   ✓ {asset['symbol']}: ${asset['price']:.2f} ({change_pct:+.2f}%) "
              f"[β={asset['beta']:.2f}, σ={asset['volatility']:.0%}] - {risk.upper()}")
    
    # 2. Create Portfolio
    print("\n2. Creating investment portfolio...")
    
    portfolio = NodeData(
        type="portfolio",
        label="Tech Growth Portfolio",
        domain="trading",
        attributes={
            "owner_id": "user_001",
            "total_value": 150000,
            "cash_balance": 10000,
            "invested_value": 140000,
            "risk_category": "aggressive",
            "portfolio_beta": 1.35
        }
    )
    portfolio_id = graph.add_node(portfolio)
    print(f"   ✓ Tech Growth Portfolio: $150,000 (β=1.35)")
    
    # 3. Create Positions
    print("\n3. Creating portfolio positions...")
    
    positions = [
        {"asset": "AAPL", "shares": 200, "entry": 175.00},
        {"asset": "MSFT", "shares": 80, "entry": 390.00},
        {"asset": "GOOGL", "shares": 150, "entry": 165.00},
        {"asset": "TSLA", "shares": 50, "entry": 220.00},
        {"asset": "JNJ", "shares": 100, "entry": 158.00},
    ]
    
    position_nodes = {}
    for pos in positions:
        asset = next(a for a in assets if a["symbol"] == pos["asset"])
        current_price = asset["price"]
        
        node = NodeData(
            type="position",
            label=f"{pos['asset']} Position",
            domain="trading",
            attributes={
                "asset_symbol": pos["asset"],
                "position_type": "long",
                "shares": pos["shares"],
                "entry_price": pos["entry"],
                "current_price": current_price
            }
        )
        enriched = trading.enrich_node(node)
        pos_id = graph.add_node(enriched)
        position_nodes[pos["asset"]] = pos_id
        
        pnl = enriched.attributes.get('unrealized_pnl', 0)
        pnl_pct = enriched.attributes.get('pnl_pct', 0)
        
        # Create edges: portfolio -> position -> asset
        edge1 = EdgeData(source=portfolio_id, target=pos_id, type="holding")
        edge2 = EdgeData(source=pos_id, target=asset_nodes[pos["asset"]], type="holding")
        graph.add_edge(edge1)
        graph.add_edge(edge2)
        
        print(f"   ✓ {pos['asset']}: {pos['shares']} shares @ ${pos['entry']:.2f} → ${current_price:.2f} "
              f"(P&L: ${pnl:+,.2f}, {pnl_pct:+.2f}%)")
    
    # 4. Add Correlations
    print("\n4. Adding asset correlations...")
    
    correlations = [
        ("AAPL", "MSFT", 0.82),
        ("AAPL", "GOOGL", 0.75),
        ("MSFT", "GOOGL", 0.80),
        ("AAPL", "TSLA", 0.45),
        ("JPM", "XOM", 0.35),
        ("JNJ", "JPM", -0.15),
    ]
    
    for asset1, asset2, coef in correlations:
        edge = EdgeData(
            source=asset_nodes[asset1],
            target=asset_nodes[asset2],
            type="correlation",
            attributes={
                "correlation_coefficient": coef,
                "correlation_type": "positive" if coef > 0 else "negative"
            }
        )
        graph.add_edge(edge)
        
        strength = "Strong" if abs(coef) >= 0.7 else "Moderate"
        direction = "+" if coef > 0 else ""
        print(f"   ✓ {asset1} ↔ {asset2}: {direction}{coef:.2f} ({strength})")
    
    # 5. Run Correlation Analysis
    print("\n5. Running Correlation Analysis...")
    print("-" * 70)
    
    algorithms = trading.get_algorithms()
    corr_algo = [a for a in algorithms if a.name == "correlation_analysis"][0]
    
    corr_results = corr_algo.run(graph, {"correlation_threshold": 0.7})
    
    print(f"\nHigh correlations found: {corr_results['total_high_correlations']}")
    print(f"Concentration risk detected: {corr_results['concentration_risk']}")
    
    if corr_results['high_correlations']:
        print("\n⚠ Highly Correlated Asset Pairs:")
        for corr in corr_results['high_correlations'][:5]:
            print(f"  • {corr['asset1']} ↔ {corr['asset2']}: {corr['coefficient']:.2f} ({corr['strength']})")
    
    if corr_results['asset_clusters']:
        print("\n⚠ Correlated Asset Clusters (Concentration Risk):")
        for cluster in corr_results['asset_clusters']:
            print(f"  • Cluster {cluster['cluster_id']}: {cluster['size']} assets")
            print(f"    Assets: {', '.join(cluster['assets'])}")
            print(f"    Risk: {cluster['concentration_risk'].upper()}")
    
    # 6. Run Portfolio Risk Assessment
    print("\n6. Running Portfolio Risk Assessment...")
    print("-" * 70)
    
    risk_algo = [a for a in algorithms if a.name == "portfolio_risk"][0]
    risk_results = risk_algo.run(graph)
    
    if risk_results['portfolio_assessments']:
        for portfolio_risk in risk_results['portfolio_assessments']:
            print(f"\nPortfolio: {portfolio_risk['portfolio_name']}")
            print(f"  Positions: {portfolio_risk['positions_count']}")
            print(f"  Asset Types: {portfolio_risk['asset_types']}")
            print(f"  Sectors: {portfolio_risk['sectors']}")
            print(f"  Diversification Score: {portfolio_risk['diversification_score']:.0f}/100")
            print(f"  Risk Score: {portfolio_risk['risk_score']:.1f}/100")
            print(f"  Beta: {portfolio_risk['beta']:.2f}")
            print(f"  Risk Level: {portfolio_risk['risk_level'].upper()}")
    
    print(f"\nAverage Diversification: {risk_results['average_diversification']:.1f}/100")
    print(f"High-Risk Portfolios: {risk_results['high_risk_portfolios']}")
    
    # 7. Run Dependency Propagation
    print("\n7. Running Dependency Propagation Analysis...")
    print("-" * 70)
    
    prop_algo = [a for a in algorithms if a.name == "dependency_propagation"][0]
    prop_results = prop_algo.run(graph, {"max_depth": 3})
    
    print(f"\nPropagation paths identified: {prop_results['total_propagations']}")
    print(f"Systemic risk present: {prop_results['systemic_risk_present']}")
    
    if prop_results['propagation_paths']:
        print("\n⚠ High-Impact Propagation Paths:")
        for path in prop_results['propagation_paths'][:3]:
            print(f"  • Source: {path['source_asset']}")
            print(f"    Could affect: {path['affected_count']} assets")
            print(f"    Systemic risk: {path['systemic_risk'].upper()}")
    
    if prop_results['systemic_risk_nodes']:
        print("\n⚠ Systemic Risk Nodes (Highly Connected):")
        for node in prop_results['systemic_risk_nodes'][:3]:
            print(f"  • {node['asset']}")
            print(f"    High correlations: {node['correlation_connections']}")
            print(f"    Risk level: {node['risk_level'].upper()}")
    
    # 8. Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Assets analyzed: {len(assets)}")
    print(f"Portfolio value: $150,000")
    print(f"Positions: {len(positions)}")
    print(f"High correlations: {corr_results['total_high_correlations']}")
    print(f"Diversification score: {risk_results['average_diversification']:.0f}/100")
    print(f"Portfolio risk: {risk_results['portfolio_assessments'][0]['risk_level'].upper()}")
    
    if corr_results['concentration_risk']:
        print("\n⚠ WARNING: Concentration risk detected in tech sector")
        print("   Recommendation: Consider diversifying into other sectors")
    
    if risk_results['portfolio_assessments'][0]['risk_score'] >= 60:
        print("\n⚠ WARNING: High portfolio risk detected")
        print("   Recommendation: Reduce exposure to high-beta stocks")
    
    print("=" * 70)
    
    return graph, {
        "correlation": corr_results,
        "risk": risk_results,
        "propagation": prop_results
    }


if __name__ == "__main__":
    graph, results = create_portfolio_analysis_example()
    
    print("\n\nAPI Integration:")
    print("POST /api/v1/domains/run-algorithm")
    print('{"domain": "trading", "algorithm_name": "portfolio_risk", ...}')
