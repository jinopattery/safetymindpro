"""
Trading Domain Mapper

Maps trading/investment concepts to the universal Form-Function-Failure graph.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.core.domain_mapper import DomainMapper
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode,
    FunctionBranch, FailurePropagationBranch
)


class TradingMapper(DomainMapper):
    """
    Maps trading concepts to universal graph.
    
    Mappings:
    - Portfolio/Asset → FormElement
    - Trade Execution/Strategy → Function
    - Market Risk/Crash → FailureMode
    - Portfolio properties → Time-series (value, volatility, returns)
    """
    
    @property
    def domain_name(self) -> str:
        return "trading"
    
    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert trading data to universal graph.
        
        Expected domain_data structure:
        {
            'portfolios': [...],
            'risks': [...],
            'strategies': [...],
            'relationships': {...}
        }
        """
        graph = UniversalGraph()
        graph.graph_metadata = {
            'domain': 'trading',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Map portfolios/assets to form elements
        portfolios = domain_data.get('portfolios', [])
        for portfolio_data in portfolios:
            form = self.map_form_element(portfolio_data)
            graph.add_form_element(form)
        
        # Map trading strategies/executions to functions
        strategies = domain_data.get('strategies', [])
        for strategy_data in strategies:
            function = self.map_function(strategy_data)
            graph.add_function(function)
        
        # Map market risks to failure modes
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
        Map portfolio/asset to FormElement.
        
        Characteristics (static):
        - portfolio_type: Type of portfolio
        - manager: Portfolio manager
        - strategy: Investment strategy
        - asset_class: Asset class
        
        Properties (time-series):
        - value: Portfolio value
        - volatility: Volatility measure
        - returns: Returns percentage
        - sharpe_ratio: Risk-adjusted returns
        """
        element_id = domain_element.get('id', domain_element.get('portfolio_id', 'unknown'))
        element_type = domain_element.get('type', 'portfolio')
        
        form = FormElement(id=element_id, element_type=element_type)
        
        # Map static characteristics
        form.set_characteristic('portfolio_type', domain_element.get('portfolio_type'))
        form.set_characteristic('manager', domain_element.get('manager'))
        form.set_characteristic('strategy', domain_element.get('strategy'))
        form.set_characteristic('asset_class', domain_element.get('asset_class'))
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
        Map trading strategy/execution to Function.
        
        Examples:
        - "Execute Trade"
        - "Rebalance Portfolio"
        - "Hedge Position"
        - "Calculate Risk"
        """
        func_id = domain_function.get('id', domain_function.get('strategy_id', 'unknown'))
        name = domain_function.get('name', 'Unknown Strategy')
        
        func = Function(id=func_id, name=name)
        func.inputs = domain_function.get('inputs', [])
        func.outputs = domain_function.get('outputs', [])
        func.performance_metrics = domain_function.get('performance', {})
        
        return func
    
    def map_failure_mode(self, domain_failure: Dict[str, Any]) -> FailureMode:
        """
        Map market risk to FailureMode.
        
        Args:
            domain_failure: Risk data
            {
                'id': 'RISK_001',
                'risk_type': 'Market Crash',
                'portfolio': 'PORT_001',
                'severity': 9,
                'likelihood': 0.05,
                'hedges': ['Stop loss', 'Options hedge']
            }
        """
        failure_id = domain_failure.get('id', domain_failure.get('risk_id', 'unknown'))
        name = domain_failure.get('risk_type', domain_failure.get('name', 'Unknown Risk'))
        
        failure = FailureMode(id=failure_id, name=name)
        
        # Map risk ratings
        failure.severity = domain_failure.get('severity', 5)
        failure.probability = domain_failure.get('likelihood', 0.5)
        failure.detectability = domain_failure.get('detectability', 5)
        
        # Map relationships
        portfolio_id = domain_failure.get('portfolio')
        if portfolio_id:
            failure.affects_forms = [portfolio_id]
        
        # Map hedges/controls
        hedges = domain_failure.get('hedges', [])
        failure.mitigated_by = hedges if isinstance(hedges, list) else [hedges]
        
        return failure
    
    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to trading format.
        """
        formatted = {
            'domain': 'trading',
            'analysis_type': results.get('analysis_type', 'unknown'),
            'results': {}
        }
        
        # Format criticality scores as portfolio risks
        if 'criticality_scores' in results:
            formatted['results']['high_risk_portfolios'] = []
            for form_id, score in results['criticality_scores'].items():
                if form_id in graph.form_elements:
                    form = graph.form_elements[form_id]
                    formatted['results']['high_risk_portfolios'].append({
                        'portfolio_id': form_id,
                        'portfolio_type': form.type,
                        'strategy': form.characteristics.get('strategy'),
                        'manager': form.characteristics.get('manager'),
                        'risk_score': score,
                        'risk_level': self._score_to_risk_level(score)
                    })
        
        # Format market risks
        if 'risk_priorities' in results:
            formatted['results']['market_risks'] = []
            for risk in results['risk_priorities']:
                failure_id = risk['failure_id']
                if failure_id in graph.failure_modes:
                    failure = graph.failure_modes[failure_id]
                    formatted['results']['market_risks'].append({
                        'risk_type': failure.name,
                        'risk_score': risk['risk_score'],
                        'severity': failure.severity,
                        'likelihood': failure.probability,
                        'affected_portfolios': risk['forms_affected'],
                        'hedges': failure.mitigated_by
                    })
        
        # Format portfolio performance trends
        if 'trends' in results:
            formatted['results']['portfolio_performance'] = self._format_trading_trends(
                results['trends'], graph
            )
        
        return formatted
    
    def _score_to_risk_level(self, score: float) -> str:
        """Convert risk score to trading risk level."""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.3:
            return 'medium'
        else:
            return 'low'
    
    def _format_trading_trends(
        self,
        trends: Dict[str, Dict[str, Dict[str, Any]]],
        graph: UniversalGraph
    ) -> List[Dict[str, Any]]:
        """Format portfolio performance trends."""
        trading_trends = []
        
        for form_id, property_trends in trends.items():
            if form_id in graph.form_elements:
                form = graph.form_elements[form_id]
                
                for property_name, trend in property_trends.items():
                    trading_trends.append({
                        'portfolio_id': form_id,
                        'portfolio_type': form.type,
                        'strategy': form.characteristics.get('strategy'),
                        'metric': property_name,
                        'trend': trend['direction'],
                        'rate_of_change': trend.get('rate_of_change_percent', 0),
                        'status': self._assess_trading_status(property_name, trend, form)
                    })
        
        return trading_trends
    
    def _assess_trading_status(
        self,
        property_name: str,
        trend: Dict[str, Any],
        form: FormElement
    ) -> str:
        """Assess trading metric status."""
        direction = trend.get('direction', 'stable')
        rate = abs(trend.get('rate_of_change_percent', 0))
        
        # Value decreasing rapidly = warning
        if property_name == 'value' and direction == 'decreasing' and rate > 5:
            return 'warning'
        
        # Volatility increasing = risky
        if property_name == 'volatility' and direction == 'increasing':
            return 'risky'
        
        # Returns decreasing = underperforming
        if property_name == 'returns' and direction == 'decreasing':
            return 'underperforming'
        
        # Sharpe ratio increasing = good
        if property_name == 'sharpe_ratio' and direction == 'increasing':
            return 'outperforming'
        
        return 'normal'
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get trading domain metadata."""
        return {
            'domain': 'trading',
            'version': '1.0',
            'standards': ['VaR', 'CVaR', 'Sharpe Ratio'],
            'supported_analyses': [
                'portfolio_risk',
                'market_risk',
                'performance_analysis',
                'volatility_analysis'
            ]
        }
