"""
Financial Domain Adapter

Implements the DomainAdapter interface for banking, fraud detection, and AML.
"""

from typing import Dict, List, Any, Optional
from backend.domains.base import (
    DomainAdapter, DomainNodeType, DomainEdgeType,
    DomainAlgorithm, StylingConfig
)
from backend.core.graph import NodeData, EdgeData, Graph
from backend.domains.financial.models import (
    Account, Transaction, Entity, FraudCase,
    AccountType, TransactionType, RiskLevel, FraudIndicator
)
import networkx as nx
from collections import defaultdict
from datetime import datetime, timedelta


class FraudDetectionAlgorithm(DomainAlgorithm):
    """Detects fraudulent transactions using network analysis"""
    
    @property
    def name(self) -> str:
        return "fraud_detection"
    
    @property
    def description(self) -> str:
        return "Detects suspicious transactions using velocity, amount, and network anomalies"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run fraud detection"""
        velocity_threshold = params.get('velocity_threshold', 5) if params else 5
        amount_threshold = params.get('amount_multiplier', 3.0) if params else 3.0
        
        suspicious_transactions = []
        
        # Calculate account statistics
        account_stats = defaultdict(lambda: {
            'transaction_count': 0,
            'total_amount': 0.0,
            'amounts': [],
            'transactions': []
        })
        
        # Collect transaction data
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'transaction':
                attrs = node_data.get('attributes', {})
                from_account = attrs.get('from_account')
                amount = attrs.get('amount', 0)
                
                if from_account:
                    account_stats[from_account]['transaction_count'] += 1
                    account_stats[from_account]['total_amount'] += amount
                    account_stats[from_account]['amounts'].append(amount)
                    account_stats[from_account]['transactions'].append(node_id)
        
        # Analyze transactions for anomalies
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'transaction':
                attrs = node_data.get('attributes', {})
                from_account = attrs.get('from_account')
                amount = attrs.get('amount', 0)
                fraud_score = 0
                indicators = []
                
                if from_account and from_account in account_stats:
                    stats = account_stats[from_account]
                    
                    # Velocity check - too many transactions in short time
                    if stats['transaction_count'] >= velocity_threshold:
                        fraud_score += 30
                        indicators.append('velocity_anomaly')
                    
                    # Amount anomaly - significantly larger than average
                    if stats['amounts']:
                        avg_amount = stats['total_amount'] / len(stats['amounts'])
                        if amount > avg_amount * amount_threshold and avg_amount > 0:
                            fraud_score += 40
                            indicators.append('amount_anomaly')
                
                # Network anomaly - transaction to unusual account
                out_degree = graph.graph.out_degree(node_id)
                if out_degree > 5:  # Too many outgoing connections
                    fraud_score += 20
                    indicators.append('unusual_network')
                
                # Update node with fraud analysis
                graph.graph.nodes[node_id]['attributes']['fraud_score'] = fraud_score
                graph.graph.nodes[node_id]['attributes']['fraud_indicators'] = indicators
                graph.graph.nodes[node_id]['attributes']['is_suspicious'] = fraud_score >= 50
                
                if fraud_score >= 50:
                    suspicious_transactions.append({
                        'transaction_id': node_id,
                        'fraud_score': fraud_score,
                        'amount': amount,
                        'indicators': indicators,
                        'from_account': from_account
                    })
        
        return {
            'suspicious_transactions': sorted(suspicious_transactions, key=lambda x: x['fraud_score'], reverse=True),
            'total_flagged': len(suspicious_transactions),
            'total_analyzed': len([n for n, d in graph.graph.nodes(data=True) if d.get('type') == 'transaction'])
        }


class MoneyLaunderingDetection(DomainAlgorithm):
    """Detects potential money laundering patterns"""
    
    @property
    def name(self) -> str:
        return "aml_detection"
    
    @property
    def description(self) -> str:
        return "Anti-Money Laundering detection using pattern analysis"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Detect money laundering patterns"""
        structuring_threshold = params.get('structuring_threshold', 10000) if params else 10000
        rapid_movement_hours = params.get('rapid_movement_hours', 24) if params else 24
        
        aml_alerts = []
        
        # Pattern 1: Structuring - Multiple transactions just below threshold
        account_transactions = defaultdict(list)
        
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'transaction':
                attrs = node_data.get('attributes', {})
                from_account = attrs.get('from_account')
                amount = attrs.get('amount', 0)
                
                if from_account and 0.8 * structuring_threshold < amount < structuring_threshold:
                    account_transactions[from_account].append({
                        'id': node_id,
                        'amount': amount
                    })
        
        # Check for structuring
        for account, transactions in account_transactions.items():
            if len(transactions) >= 3:  # Multiple transactions near threshold
                total_amount = sum(t['amount'] for t in transactions)
                aml_alerts.append({
                    'alert_type': 'structuring',
                    'account': account,
                    'transaction_count': len(transactions),
                    'total_amount': total_amount,
                    'suspicion_score': min(100, len(transactions) * 20)
                })
                
                # Mark account
                account_nodes = [
                    n for n, d in graph.graph.nodes(data=True)
                    if d.get('type') == 'account' and d.get('attributes', {}).get('account_number') == account
                ]
                for acc_node in account_nodes:
                    if 'aml_flags' not in graph.graph.nodes[acc_node]['attributes']:
                        graph.graph.nodes[acc_node]['attributes']['aml_flags'] = []
                    graph.graph.nodes[acc_node]['attributes']['aml_flags'].append('structuring')
        
        # Pattern 2: Rapid movement - money moving through multiple accounts quickly
        # Find chains of transactions
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'transaction':
                try:
                    # Find paths of length 3+ from this transaction
                    paths = []
                    for target in graph.graph.nodes():
                        if target != node_id:
                            try:
                                path = nx.shortest_path(graph.graph, node_id, target)
                                if len(path) >= 4:  # Transaction chain
                                    paths.append(path)
                            except:
                                pass
                    
                    if paths:
                        longest_path = max(paths, key=len)
                        if len(longest_path) >= 4:
                            aml_alerts.append({
                                'alert_type': 'rapid_movement',
                                'chain_length': len(longest_path),
                                'suspicion_score': min(100, (len(longest_path) - 3) * 25)
                            })
                except:
                    pass
        
        return {
            'aml_alerts': sorted(aml_alerts, key=lambda x: x['suspicion_score'], reverse=True),
            'total_alerts': len(aml_alerts),
            'structuring_cases': len([a for a in aml_alerts if a['alert_type'] == 'structuring']),
            'rapid_movement_cases': len([a for a in aml_alerts if a['alert_type'] == 'rapid_movement'])
        }


class RiskScoringAlgorithm(DomainAlgorithm):
    """Calculate risk scores for accounts and entities"""
    
    @property
    def name(self) -> str:
        return "risk_scoring"
    
    @property
    def description(self) -> str:
        return "Calculates comprehensive risk scores for accounts based on behavior and connections"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculate risk scores"""
        
        risk_assessments = []
        
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'account':
                attrs = node_data.get('attributes', {})
                risk_score = 0.0
                risk_factors = []
                
                # Factor 1: Transaction volume
                out_degree = graph.graph.out_degree(node_id)
                if out_degree > 20:
                    risk_score += 20
                    risk_factors.append('high_transaction_volume')
                
                # Factor 2: Dormant account suddenly active
                last_activity = attrs.get('last_activity')
                opened_date = attrs.get('opened_date')
                if last_activity and opened_date:
                    # This is simplified - in real use would parse dates
                    risk_score += 10
                    risk_factors.append('activity_pattern_change')
                
                # Factor 3: Connections to high-risk accounts
                high_risk_connections = 0
                for neighbor in graph.graph.neighbors(node_id):
                    neighbor_data = graph.graph.nodes[neighbor]
                    if neighbor_data.get('type') == 'account':
                        neighbor_risk = neighbor_data.get('attributes', {}).get('risk_score', 0)
                        if neighbor_risk > 70:
                            high_risk_connections += 1
                
                if high_risk_connections > 0:
                    risk_score += min(30, high_risk_connections * 10)
                    risk_factors.append('high_risk_connections')
                
                # Factor 4: AML flags
                aml_flags = attrs.get('aml_flags', [])
                if aml_flags:
                    risk_score += len(aml_flags) * 15
                    risk_factors.append('aml_flagged')
                
                # Factor 5: Fraud flags
                fraud_flags = attrs.get('fraud_flags', [])
                if fraud_flags:
                    risk_score += len(fraud_flags) * 20
                    risk_factors.append('fraud_flagged')
                
                # Cap at 100
                risk_score = min(100, risk_score)
                
                # Update node
                graph.graph.nodes[node_id]['attributes']['risk_score'] = risk_score
                graph.graph.nodes[node_id]['attributes']['risk_factors'] = risk_factors
                
                risk_level = (
                    'critical' if risk_score >= 80 else
                    'high' if risk_score >= 60 else
                    'medium' if risk_score >= 30 else
                    'low'
                )
                graph.graph.nodes[node_id]['attributes']['risk_level'] = risk_level
                
                risk_assessments.append({
                    'account_id': node_id,
                    'account_number': attrs.get('account_number', 'unknown'),
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'risk_factors': risk_factors
                })
        
        return {
            'risk_assessments': sorted(risk_assessments, key=lambda x: x['risk_score'], reverse=True),
            'total_assessed': len(risk_assessments),
            'high_risk_accounts': len([r for r in risk_assessments if r['risk_score'] >= 60]),
            'average_risk': sum(r['risk_score'] for r in risk_assessments) / len(risk_assessments) if risk_assessments else 0
        }


class FinancialDomain(DomainAdapter):
    """
    Financial domain adapter for banking, fraud detection, and AML.
    
    Supports transaction networks, fraud detection, and anti-money laundering analysis.
    """
    
    @property
    def domain_name(self) -> str:
        return "financial"
    
    @property
    def domain_display_name(self) -> str:
        return "Financial Services"
    
    @property
    def description(self) -> str:
        return "Banking transaction analysis, fraud detection, and anti-money laundering monitoring"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            DomainNodeType(
                name="account",
                display_name="Account",
                icon="💰",
                description="Financial account (checking, savings, credit, etc.)",
                default_attributes={
                    "account_type": "checking",
                    "balance": 0.0,
                    "risk_score": 0.0,
                    "status": "active"
                }
            ),
            DomainNodeType(
                name="transaction",
                display_name="Transaction",
                icon="💸",
                description="Financial transaction between accounts",
                default_attributes={
                    "amount": 0.0,
                    "currency": "USD",
                    "transaction_type": "transfer",
                    "fraud_score": 0.0
                }
            ),
            DomainNodeType(
                name="entity",
                display_name="Entity",
                icon="👤",
                description="Person or organization",
                default_attributes={
                    "entity_type": "individual",
                    "risk_level": "low",
                    "kyc_verified": False
                }
            ),
            DomainNodeType(
                name="fraud_case",
                display_name="Fraud Case",
                icon="🚨",
                description="Detected fraud case",
                default_attributes={
                    "severity": 5,
                    "status": "open",
                    "confidence_score": 0.5
                }
            )
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            DomainEdgeType(
                name="transfer",
                display_name="Transfer",
                description="Money transfer between accounts",
                directed=True,
                default_attributes={
                    "amount": 0.0,
                    "currency": "USD",
                    "timestamp": None
                }
            ),
            DomainEdgeType(
                name="ownership",
                display_name="Ownership",
                description="Entity owns account",
                directed=True,
                default_attributes={
                    "ownership_percentage": 100.0
                }
            ),
            DomainEdgeType(
                name="relationship",
                display_name="Relationship",
                description="Relationship between entities",
                directed=False,
                default_attributes={
                    "relationship_type": "unknown"
                }
            ),
            DomainEdgeType(
                name="fraud_link",
                display_name="Fraud Link",
                description="Connection in fraud case",
                directed=True,
                default_attributes={
                    "evidence_strength": "medium"
                }
            )
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                "account": {
                    "shape": "rectangle",
                    "backgroundColor": "#27ae60",
                    "color": "#ffffff",
                    "borderColor": "#229954",
                    "borderWidth": 2,
                    "fontSize": 13,
                    "padding": 12,
                    "borderRadius": 6
                },
                "transaction": {
                    "shape": "diamond",
                    "backgroundColor": "#3498db",
                    "color": "#ffffff",
                    "borderColor": "#2980b9",
                    "borderWidth": 2,
                    "fontSize": 11,
                    "padding": 8
                },
                "entity": {
                    "shape": "circle",
                    "backgroundColor": "#9b59b6",
                    "color": "#ffffff",
                    "borderColor": "#8e44ad",
                    "borderWidth": 2,
                    "fontSize": 12,
                    "padding": 10
                },
                "fraud_case": {
                    "shape": "star",
                    "backgroundColor": "#e74c3c",
                    "color": "#ffffff",
                    "borderColor": "#c0392b",
                    "borderWidth": 3,
                    "fontSize": 12,
                    "padding": 10,
                    "pulsate": True
                }
            },
            edge_styles={
                "transfer": {
                    "stroke": "#27ae60",
                    "strokeWidth": 2,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 8
                },
                "ownership": {
                    "stroke": "#9b59b6",
                    "strokeWidth": 1.5,
                    "type": "straight",
                    "arrowSize": 6
                },
                "relationship": {
                    "stroke": "#95a5a6",
                    "strokeWidth": 1,
                    "strokeDasharray": "4,2",
                    "type": "smoothstep"
                },
                "fraud_link": {
                    "stroke": "#e74c3c",
                    "strokeWidth": 3,
                    "strokeDasharray": "6,3",
                    "animated": True,
                    "type": "step",
                    "arrowSize": 10
                }
            },
            theme={
                "name": "Financial",
                "primaryColor": "#27ae60",
                "dangerColor": "#e74c3c",
                "successColor": "#2ecc71",
                "warningColor": "#f39c12",
                "backgroundColor": "#ecf0f1",
                "gridColor": "#bdc3c7"
            }
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            FraudDetectionAlgorithm(),
            MoneyLaunderingDetection(),
            RiskScoringAlgorithm()
        ]
    
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate financial node"""
        node_type = node_data.get('type')
        
        valid_types = [nt.name for nt in self.get_node_types()]
        if node_type not in valid_types:
            return False
        
        if node_type == 'transaction':
            attrs = node_data.get('attributes', {})
            amount = attrs.get('amount', 0)
            if amount < 0:
                return False
        
        elif node_type == 'fraud_case':
            attrs = node_data.get('attributes', {})
            severity = attrs.get('severity', 5)
            if not (1 <= severity <= 10):
                return False
            
            confidence = attrs.get('confidence_score', 0.5)
            if not (0.0 <= confidence <= 1.0):
                return False
        
        return True
    
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate financial edge"""
        edge_type = edge_data.get('type')
        
        valid_types = [et.name for et in self.get_edge_types()]
        if edge_type not in valid_types:
            return False
        
        if edge_type == 'transfer':
            attrs = edge_data.get('attributes', {})
            amount = attrs.get('amount', 0)
            if amount < 0:
                return False
        
        elif edge_type == 'ownership':
            attrs = edge_data.get('attributes', {})
            percentage = attrs.get('ownership_percentage', 100)
            if not (0 <= percentage <= 100):
                return False
        
        return True
    
    def enrich_node(self, node: NodeData) -> NodeData:
        """Enrich financial node with calculated attributes"""
        if node.type == 'account':
            attrs = node.attributes
            balance = attrs.get('balance', 0)
            
            # Add balance category
            if balance < 0:
                attrs['balance_category'] = 'negative'
            elif balance < 1000:
                attrs['balance_category'] = 'low'
            elif balance < 10000:
                attrs['balance_category'] = 'medium'
            else:
                attrs['balance_category'] = 'high'
        
        elif node.type == 'transaction':
            attrs = node.attributes
            amount = attrs.get('amount', 0)
            
            # Add transaction size category
            if amount < 100:
                attrs['size_category'] = 'small'
            elif amount < 1000:
                attrs['size_category'] = 'medium'
            elif amount < 10000:
                attrs['size_category'] = 'large'
            else:
                attrs['size_category'] = 'very_large'
        
        return node
    
    def get_export_formats(self) -> List[str]:
        return ['json', 'excel', 'csv', 'graphml', 'pdf']
