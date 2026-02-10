"""
Example: Financial Domain - Fraud Detection

Demonstrates fraud detection in a banking network.
"""

from backend.domains import get_domain
from backend.core.graph import Graph, NodeData, EdgeData
import json
from decimal import Decimal


def create_fraud_detection_example():
    """
    Create a banking network with suspicious transactions for fraud detection.
    """
    
    financial = get_domain("financial")
    if not financial:
        print("ERROR: Financial domain not registered!")
        return
    
    print("=" * 70)
    print("Financial Domain Example: Banking Fraud Detection")
    print("=" * 70)
    print()
    
    # Create graph
    graph = Graph(directed=True)
    
    # 1. Create Accounts
    print("1. Creating bank accounts...")
    
    accounts = [
        {"id": "acc_101", "name": "Alice Johnson", "balance": 15000, "risk": 10},
        {"id": "acc_102", "name": "Bob Smith", "balance": 8500, "risk": 15},
        {"id": "acc_103", "name": "Charlie Davis", "balance": 45000, "risk": 5},
        {"id": "acc_104", "name": "Suspicious Account X", "balance": 500, "risk": 85},
        {"id": "acc_105", "name": "Merchant ABC", "balance": 120000, "risk": 20},
    ]
    
    account_nodes = {}
    for acc in accounts:
        node = NodeData(
            type="account",
            label=acc["name"],
            domain="financial",
            attributes={
                "account_number": acc["id"],
                "account_type": "checking",
                "balance": acc["balance"],
                "risk_score": acc["risk"],
                "status": "active"
            }
        )
        enriched = financial.enrich_node(node)
        node_id = graph.add_node(enriched)
        account_nodes[acc["id"]] = node_id
        
        print(f"   ✓ {acc['name']}: ${acc['balance']:,} (Risk: {acc['risk']}/100)")
    
    # 2. Create Normal Transactions
    print("\n2. Creating normal transactions...")
    
    normal_txns = [
        ("acc_101", "acc_105", 150, "Grocery purchase"),
        ("acc_102", "acc_105", 75, "Online shopping"),
        ("acc_103", "acc_101", 500, "Loan repayment"),
    ]
    
    for from_acc, to_acc, amount, desc in normal_txns:
        node = NodeData(
            type="transaction",
            label=f"${amount} - {desc}",
            domain="financial",
            attributes={
                "from_account": from_acc,
                "to_account": to_acc,
                "amount": amount,
                "currency": "USD",
                "transaction_type": "transfer",
                "description": desc
            }
        )
        txn_id = graph.add_node(node)
        
        # Create edges
        edge1 = EdgeData(source=account_nodes[from_acc], target=txn_id, type="transfer")
        edge2 = EdgeData(source=txn_id, target=account_nodes[to_acc], type="transfer")
        graph.add_edge(edge1)
        graph.add_edge(edge2)
        
        print(f"   ✓ {from_acc} → {to_acc}: ${amount} ({desc})")
    
    # 3. Create Suspicious Transactions
    print("\n3. Creating suspicious transaction patterns...")
    
    # Pattern 1: Velocity anomaly - rapid succession of transactions
    rapid_txns = [
        ("acc_104", "acc_101", 95, "Transfer 1"),
        ("acc_104", "acc_102", 97, "Transfer 2"),
        ("acc_104", "acc_103", 93, "Transfer 3"),
        ("acc_104", "acc_105", 98, "Transfer 4"),
        ("acc_104", "acc_101", 96, "Transfer 5"),  # Multiple to same account
        ("acc_104", "acc_102", 94, "Transfer 6"),
    ]
    
    print("   ⚠ Velocity Anomaly Pattern (Multiple rapid transactions):")
    for from_acc, to_acc, amount, desc in rapid_txns:
        node = NodeData(
            type="transaction",
            label=f"${amount} - {desc}",
            domain="financial",
            attributes={
                "from_account": from_acc,
                "to_account": to_acc,
                "amount": amount,
                "currency": "USD",
                "transaction_type": "transfer",
                "description": desc
            }
        )
        txn_id = graph.add_node(node)
        
        edge1 = EdgeData(source=account_nodes[from_acc], target=txn_id, type="transfer")
        edge2 = EdgeData(source=txn_id, target=account_nodes[to_acc], type="transfer")
        graph.add_edge(edge1)
        graph.add_edge(edge2)
        
        print(f"      • {from_acc} → {to_acc}: ${amount}")
    
    # Pattern 2: Large unusual transaction
    print("\n   ⚠ Amount Anomaly (Unusually large transaction):")
    large_txn = NodeData(
        type="transaction",
        label="$15,000 - Large transfer",
        domain="financial",
        attributes={
            "from_account": "acc_102",
            "to_account": "acc_104",
            "amount": 15000,
            "currency": "USD",
            "transaction_type": "transfer",
            "description": "Large unusual transfer"
        }
    )
    large_txn_id = graph.add_node(large_txn)
    edge1 = EdgeData(source=account_nodes["acc_102"], target=large_txn_id, type="transfer")
    edge2 = EdgeData(source=large_txn_id, target=account_nodes["acc_104"], type="transfer")
    graph.add_edge(edge1)
    graph.add_edge(edge2)
    print(f"      • acc_102 → acc_104: $15,000")
    
    # 4. Run Fraud Detection
    print("\n4. Running Fraud Detection Algorithm...")
    print("-" * 70)
    
    algorithms = financial.get_algorithms()
    fraud_algo = [a for a in algorithms if a.name == "fraud_detection"][0]
    
    fraud_results = fraud_algo.run(graph, {
        "velocity_threshold": 5,
        "amount_multiplier": 3.0
    })
    
    print(f"\nTotal transactions analyzed: {fraud_results['total_analyzed']}")
    print(f"Suspicious transactions flagged: {fraud_results['total_flagged']}")
    
    if fraud_results['suspicious_transactions']:
        print("\n⚠ Suspicious Transactions Detected:")
        for txn in fraud_results['suspicious_transactions'][:5]:  # Top 5
            print(f"  • Transaction: {txn['transaction_id'][:8]}...")
            print(f"    From Account: {txn['from_account']}")
            print(f"    Amount: ${txn['amount']:,}")
            print(f"    Fraud Score: {txn['fraud_score']}/100")
            print(f"    Indicators: {', '.join(txn['indicators'])}")
            print()
    
    # 5. Run AML Detection
    print("5. Running Anti-Money Laundering Detection...")
    print("-" * 70)
    
    aml_algo = [a for a in algorithms if a.name == "aml_detection"][0]
    aml_results = aml_algo.run(graph, {"structuring_threshold": 10000})
    
    print(f"\nTotal AML alerts: {aml_results['total_alerts']}")
    print(f"Structuring cases: {aml_results['structuring_cases']}")
    print(f"Rapid movement cases: {aml_results['rapid_movement_cases']}")
    
    if aml_results['aml_alerts']:
        print("\n⚠ AML Alerts:")
        for alert in aml_results['aml_alerts'][:3]:
            print(f"  • Type: {alert['alert_type']}")
            print(f"    Suspicion Score: {alert['suspicion_score']}/100")
            if 'account' in alert:
                print(f"    Account: {alert['account']}")
                print(f"    Transactions: {alert['transaction_count']}")
                print(f"    Total Amount: ${alert['total_amount']:,}")
            print()
    
    # 6. Run Risk Scoring
    print("6. Running Risk Scoring Algorithm...")
    print("-" * 70)
    
    risk_algo = [a for a in algorithms if a.name == "risk_scoring"][0]
    risk_results = risk_algo.run(graph)
    
    print(f"\nAccounts assessed: {risk_results['total_assessed']}")
    print(f"High-risk accounts: {risk_results['high_risk_accounts']}")
    print(f"Average risk score: {risk_results['average_risk']:.1f}/100")
    
    if risk_results['risk_assessments']:
        print("\n⚠ High-Risk Accounts:")
        high_risk = [r for r in risk_results['risk_assessments'] if r['risk_score'] >= 60]
        for acc in high_risk[:3]:
            print(f"  • Account: {acc['account_number']}")
            print(f"    Risk Score: {acc['risk_score']:.1f}/100")
            print(f"    Risk Level: {acc['risk_level'].upper()}")
            print(f"    Factors: {', '.join(acc['risk_factors'])}")
            print()
    
    # 7. Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total Accounts: {len(accounts)}")
    print(f"Total Transactions: {len(normal_txns) + len(rapid_txns) + 1}")
    print(f"Flagged for Fraud: {fraud_results['total_flagged']}")
    print(f"AML Alerts: {aml_results['total_alerts']}")
    print(f"High-Risk Accounts: {risk_results['high_risk_accounts']}")
    print("\n⚠ RECOMMENDATION: Investigate flagged transactions and high-risk accounts")
    print("=" * 70)
    
    return graph, {
        "fraud": fraud_results,
        "aml": aml_results,
        "risk": risk_results
    }


if __name__ == "__main__":
    graph, results = create_fraud_detection_example()
    
    print("\n\nAPI Integration:")
    print("POST /api/v1/domains/run-algorithm")
    print('{"domain": "financial", "algorithm_name": "fraud_detection", ...}')
