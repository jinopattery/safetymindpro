"""
Financial Domain Mapper

Maps financial concepts to the universal Form-Function-Failure graph.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.core.domain_mapper import DomainMapper
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode,
    FunctionBranch, FailurePropagationBranch
)


class FinancialMapper(DomainMapper):
    """
    Maps financial concepts to universal graph.
    
    Mappings:
    - Account/Portfolio → FormElement
    - Transaction/Process → Function
    - Fraud/Risk → FailureMode
    - Account properties → Time-series (balance, transaction_count, risk_score)
    """
    
    @property
    def domain_name(self) -> str:
        return "financial"
    
    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert financial data to universal graph.
        
        Expected domain_data structure:
        {
            'accounts': [...],
            'risks': [...],
            'processes': [...],
            'relationships': {...}
        }
        """
        graph = UniversalGraph()
        graph.metadata = {
            'domain': 'financial',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Map accounts to form elements
        accounts = domain_data.get('accounts', [])
        for account_data in accounts:
            form = self.map_form_element(account_data)
            graph.add_form_element(form)
        
        # Map processes/transactions to functions
        processes = domain_data.get('processes', [])
        for process_data in processes:
            function = self.map_function(process_data)
            graph.add_function(function)
        
        # Map risks to failure modes
        risks = domain_data.get('risks', [])
        for risk_data in risks:
            failure = self.map_failure_mode(risk_data)
            graph.add_failure_mode(failure)
        
        # Map relationships
        relationships = domain_data.get('relationships', {})
        
        for rel in relationships.get('form_to_function', []):
            graph.link_form_to_function(rel['form_id'], rel['function_id'])
        
        for rel in relationships.get('form_to_failure', []):
            graph.link_form_to_failure(rel['form_id'], rel['failure_id'])
        
        for rel in relationships.get('failure_propagation', []):
            source_id = rel['source_id']
            target_id = rel['target_id']
            if source_id in graph.failure_modes and target_id in graph.failure_modes:
                branch = FailurePropagationBranch(
                    graph.failure_modes[source_id],
                    graph.failure_modes[target_id]
                )
                branch.propagation_probability = rel.get('probability', 1.0)
                branch.propagation_mechanism = rel.get('mechanism', '')
                graph.add_failure_branch(branch)
        
        return graph
    
    def map_form_element(self, domain_element: Dict[str, Any]) -> FormElement:
        """
        Map financial account/portfolio to FormElement.
        
        Characteristics (static):
        - account_type: Type of account
        - owner: Account owner
        - institution: Financial institution
        - account_number: Account identifier
        
        Properties (time-series):
        - balance: Account balance
        - transaction_count: Number of transactions
        - risk_score: Risk assessment score
        - credit_score: Credit rating
        """
        element_id = domain_element.get('id', domain_element.get('account_id', 'unknown'))
        element_type = domain_element.get('type', 'account')
        
        form = FormElement(id=element_id, element_type=element_type)
        
        # Map static characteristics
        form.set_characteristic('account_type', domain_element.get('account_type'))
        form.set_characteristic('owner', domain_element.get('owner'))
        form.set_characteristic('institution', domain_element.get('institution'))
        form.set_characteristic('account_number', domain_element.get('account_number'))
        form.set_characteristic('currency', domain_element.get('currency', 'USD'))
        
        # Map time-series properties
        properties = domain_element.get('properties', [])
        for prop_sample in properties:
            timestamp_str = prop_sample.get('timestamp')
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except:
                    timestamp = datetime.utcnow()
            else:
                timestamp = datetime.utcnow()
            
            for key, value in prop_sample.items():
                if key != 'timestamp':
                    form.add_property_sample(timestamp, key, value)
        
        return form
    
    def map_function(self, domain_function: Dict[str, Any]) -> Function:
        """
        Map financial process/transaction to Function.
        
        Examples:
        - "Process Transaction"
        - "Verify Funds"
        - "Update Balance"
        - "Calculate Interest"
        """
        func_id = domain_function.get('id', domain_function.get('process_id', 'unknown'))
        name = domain_function.get('name', 'Unknown Process')
        
        func = Function(id=func_id, name=name)
        func.inputs = domain_function.get('inputs', [])
        func.outputs = domain_function.get('outputs', [])
        func.performance_metrics = domain_function.get('performance', {})
        
        return func
    
    def map_failure_mode(self, domain_failure: Dict[str, Any]) -> FailureMode:
        """
        Map financial risk to FailureMode.
        
        Args:
            domain_failure: Risk data
            {
                'id': 'RISK_001',
                'risk_type': 'Fraudulent Transaction',
                'account': 'ACC_001',
                'severity': 8,
                'likelihood': 0.15,
                'detection_capability': 7,
                'controls': ['Transaction monitoring', '2FA']
            }
        """
        failure_id = domain_failure.get('id', domain_failure.get('risk_id', 'unknown'))
        name = domain_failure.get('risk_type', domain_failure.get('name', 'Unknown Risk'))
        
        failure = FailureMode(id=failure_id, name=name)
        
        # Map risk ratings
        failure.severity = domain_failure.get('severity', 5)
        failure.probability = domain_failure.get('likelihood', 0.5)
        failure.detectability = domain_failure.get('detection_capability', 5)
        
        # Map relationships
        account_id = domain_failure.get('account')
        if account_id:
            failure.affects_forms = [account_id]
        
        # Map controls
        controls = domain_failure.get('controls', [])
        failure.mitigated_by = controls if isinstance(controls, list) else [controls]
        
        return failure
    
    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to financial format.
        """
        formatted = {
            'domain': 'financial',
            'analysis_type': results.get('analysis_type', 'unknown'),
            'results': {}
        }
        
        # Format criticality scores
        if 'criticality_scores' in results:
            formatted['results']['high_risk_accounts'] = []
            for form_id, score in results['criticality_scores'].items():
                if form_id in graph.form_elements:
                    form = graph.form_elements[form_id]
                    formatted['results']['high_risk_accounts'].append({
                        'account_id': form_id,
                        'account_type': form.type,
                        'account_number': form.characteristics.get('account_number'),
                        'owner': form.characteristics.get('owner'),
                        'risk_score': score,
                        'risk_level': self._score_to_risk_level(score)
                    })
        
        # Format financial risks
        if 'risk_priorities' in results:
            formatted['results']['risk_assessment'] = []
            for risk in results['risk_priorities']:
                failure_id = risk['failure_id']
                if failure_id in graph.failure_modes:
                    failure = graph.failure_modes[failure_id]
                    formatted['results']['risk_assessment'].append({
                        'risk_type': failure.name,
                        'risk_score': risk['risk_score'],
                        'severity': failure.severity,
                        'likelihood': failure.probability,
                        'affected_accounts': risk['forms_affected'],
                        'controls': failure.mitigated_by
                    })
        
        # Format account health trends
        if 'trends' in results:
            formatted['results']['account_health'] = self._format_financial_trends(
                results['trends'], graph
            )
        
        return formatted
    
    def _score_to_risk_level(self, score: float) -> str:
        """Convert risk score to financial risk level."""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.3:
            return 'medium'
        else:
            return 'low'
    
    def _format_financial_trends(
        self,
        trends: Dict[str, Dict[str, Dict[str, Any]]],
        graph: UniversalGraph
    ) -> List[Dict[str, Any]]:
        """Format financial account trends."""
        financial_trends = []
        
        for form_id, property_trends in trends.items():
            if form_id in graph.form_elements:
                form = graph.form_elements[form_id]
                
                for property_name, trend in property_trends.items():
                    financial_trends.append({
                        'account_id': form_id,
                        'account_type': form.type,
                        'account_number': form.characteristics.get('account_number'),
                        'metric': property_name,
                        'trend': trend['direction'],
                        'rate_of_change': trend.get('rate_of_change_percent', 0),
                        'status': self._assess_financial_status(property_name, trend, form)
                    })
        
        return financial_trends
    
    def _assess_financial_status(
        self,
        property_name: str,
        trend: Dict[str, Any],
        form: FormElement
    ) -> str:
        """Assess financial metric status."""
        direction = trend.get('direction', 'stable')
        rate = abs(trend.get('rate_of_change_percent', 0))
        
        # Balance decreasing rapidly = warning
        if property_name == 'balance' and direction == 'decreasing' and rate > 10:
            return 'warning'
        
        # Risk score increasing = warning
        if property_name == 'risk_score' and direction == 'increasing':
            return 'warning'
        
        # Transaction count spiking = suspicious
        if property_name == 'transaction_count' and direction == 'increasing' and rate > 50:
            return 'suspicious'
        
        return 'normal'
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get financial domain metadata."""
        return {
            'domain': 'financial',
            'version': '1.0',
            'standards': ['AML', 'KYC', 'Basel III'],
            'supported_analyses': [
                'fraud_detection',
                'risk_assessment',
                'account_monitoring',
                'transaction_analysis'
            ]
        }
