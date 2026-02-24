"""
Finance Domain Mapper

Maps finance risk concepts to the universal Form-Function-Failure graph.

Domain mapping:
- Form layer  → Share Deposits (portfolios, depos, share accounts)   🏦
- Function layer → Investment functions (long-term gain, short-term gain, dividends) 📈
- Failure layer → Financial losses (long-term loss, short-term loss, capital loss)  📉
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.core.domain_mapper import DomainMapper
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode,
    FunctionBranch, FailurePropagationBranch
)


class FinanceMapper(DomainMapper):
    """
    Maps finance concepts to universal graph.

    Mappings:
    - Financial Component → FormElement (characteristics: department, system, owner)
    - Finance risk entry → FailureMode
    - Financial process → Function
    - Component properties → Time-series data (volume, exposure, volatility)
    """

    @property
    def domain_name(self) -> str:
        return "finance"

    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert finance risk data to universal graph.

        Expected domain_data structure:
        {
            'components': [...],   # Share deposits / portfolios
            'risk_modes': [...],   # Loss modes (long-term loss, short-term loss, etc.)
            'processes': [...],    # Investment functions (long-term gain, short-term gain, etc.)
            'relationships': {...}
        }

        Args:
            domain_data: Finance-specific data

        Returns:
            UniversalGraph instance
        """
        graph = UniversalGraph()
        graph.graph_metadata = {
            'domain': 'finance',
            'created_at': datetime.utcnow().isoformat()
        }

        # Map components to form elements
        components = domain_data.get('components', [])
        for comp_data in components:
            form = self.map_form_element(comp_data)
            graph.add_form_element(form)

        # Map processes/functions
        processes_data = domain_data.get('processes', [])
        for proc_data in processes_data:
            function = self.map_function(proc_data)
            graph.add_function(function)

        # Map risk modes
        risk_modes = domain_data.get('risk_modes', [])
        for rm_data in risk_modes:
            failure = self.map_failure_mode(rm_data)
            graph.add_failure_mode(failure)

        # Map relationships
        relationships = domain_data.get('relationships', {})

        # Form-to-function relationships
        for rel in relationships.get('form_to_function', []):
            graph.link_form_to_function(rel['form_id'], rel['function_id'])

        # Function-to-failure relationships
        for rel in relationships.get('function_to_failure', []):
            graph.link_function_to_failure(rel['function_id'], rel['failure_id'])

        # Form-to-failure relationships
        for rel in relationships.get('form_to_failure', []):
            graph.link_form_to_failure(rel['form_id'], rel['failure_id'])

        # Function hierarchy
        for rel in relationships.get('function_hierarchy', []):
            parent_id = rel['parent_id']
            child_id = rel['child_id']
            if parent_id in graph.functions and child_id in graph.functions:
                graph.functions[parent_id].add_child(graph.functions[child_id])

        # Risk propagation
        for rel in relationships.get('loss_propagation', []):
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
        Map share deposit / portfolio to FormElement (Form layer 🏦).

        Characteristics (static):
        - depot_id: Custodian depot identifier
        - asset_class: e.g. equities, bonds, ETF
        - owner: Account holder name
        - regulation: Applicable regulation (e.g. MiFID II, SEC)

        Properties (time-series):
        - volume: Number of shares held
        - exposure: Financial exposure in base currency
        - volatility: Realised volatility measure
        - liquidity: Liquidity ratio

        Args:
            domain_element: Share deposit / portfolio data

        Returns:
            FormElement instance
        """
        element_id = domain_element.get('id', domain_element.get('component_id', 'unknown'))
        element_type = domain_element.get('type', 'share_deposit')

        form = FormElement(id=element_id, element_type=element_type)

        # Map static characteristics
        form.set_characteristic('depot_id', domain_element.get('depot_id'))
        form.set_characteristic('asset_class', domain_element.get('asset_class'))
        form.set_characteristic('owner', domain_element.get('owner'))
        form.set_characteristic('regulation', domain_element.get('regulation'))
        form.set_characteristic('subsystem', domain_element.get('subsystem'))

        # Map time-series properties
        properties = domain_element.get('properties', [])
        for prop_sample in properties:
            timestamp_str = prop_sample.get('timestamp')
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except Exception:
                    timestamp = datetime.utcnow()
            else:
                timestamp = datetime.utcnow()

            # Add each property as a time-series sample
            for key, value in prop_sample.items():
                if key != 'timestamp':
                    form.add_property_sample(timestamp, key, value)

        return form

    def map_function(self, domain_function: Dict[str, Any]) -> Function:
        """
        Map investment function to Function (Function layer 📈).

        Examples of investment functions:
        - Long-Term Gain: capital appreciation over holding periods > 1 year
        - Short-Term Gain: trading profit over holding periods ≤ 1 year
        - Dividend Yield: periodic income distribution from share holdings
        - Rebalancing: portfolio weight adjustment to maintain strategy

        Args:
            domain_function: Investment function data
            {
                'id': 'FUNC_001',
                'name': 'Long-Term Gain',
                'inputs': ['share_purchase_price'],
                'outputs': ['capital_gain'],
                'performance': {'holding_period_years': 3}
            }

        Returns:
            Function instance
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
        Map finance loss mode to FailureMode (Failure layer 📉).

        Examples of loss modes:
        - Long-Term Capital Loss: erosion of investment value over multi-year horizon
        - Short-Term Trading Loss: mark-to-market loss within a single reporting period
        - Dividend Loss: reduction or suspension of dividend payments
        - Liquidity Shortfall: inability to liquidate positions without significant discount

        Args:
            domain_failure: Loss mode data
            {
                'id': 'LM_001',
                'risk_mode': 'Long-Term Capital Loss',
                'component': 'DEPO_001',
                'severity': 8,
                'occurrence': 5,
                'detection': 3,
                'effects': ['Portfolio value decline'],
                'causes': ['Market downturn', 'Sector concentration'],
                'controls': ['Stop-loss order', 'Diversification']
            }

        Returns:
            FailureMode instance
        """
        failure_id = domain_failure.get('id', domain_failure.get('loss_id', 'unknown'))
        name = domain_failure.get('risk_mode', domain_failure.get('name', 'Unknown Loss'))

        failure = FailureMode(id=failure_id, name=name)

        # Map risk ratings
        severity = domain_failure.get('severity', 5)
        occurrence = domain_failure.get('occurrence', 5)
        detection = domain_failure.get('detection', 5)

        failure.severity = severity
        # Convert occurrence (1-10 scale) to probability (0-1 scale)
        failure.probability = occurrence / 10.0
        failure.detectability = detection

        # Map relationships
        component_id = domain_failure.get('component')
        if component_id:
            failure.affects_forms = [component_id]

        # Map controls
        controls = domain_failure.get('controls', [])
        failure.mitigated_by = controls if isinstance(controls, list) else [controls]

        return failure

    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to finance-specific format.

        Args:
            results: Universal algorithm results
            graph: UniversalGraph that was analyzed

        Returns:
            Finance-specific formatted results
        """
        formatted = {
            'domain': 'finance',
            'analysis_type': results.get('analysis_type', 'unknown'),
            'results': {}
        }

        # Format criticality scores as RPN-like values
        if 'criticality_scores' in results:
            formatted['results']['critical_share_deposits'] = []
            for form_id, score in results['criticality_scores'].items():
                if form_id in graph.form_elements:
                    form = graph.form_elements[form_id]
                    formatted['results']['critical_share_deposits'].append({
                        'component_id': form_id,
                        'deposit_type': form.type,
                        'depot_id': form.characteristics.get('depot_id'),
                        'criticality_score': score,
                        'risk_level': self._score_to_risk_level(score)
                    })

        # Format risk priorities
        if 'risk_priorities' in results:
            formatted['results']['loss_analysis'] = []
            for risk in results['risk_priorities']:
                failure_id = risk['failure_id']
                if failure_id in graph.failure_modes:
                    failure = graph.failure_modes[failure_id]
                    formatted['results']['loss_analysis'].append({
                        'loss_mode': failure.name,
                        'rpn': int(risk['risk_score'] * 100),
                        'severity': failure.severity,
                        'occurrence': int(failure.probability * 10),
                        'detection': failure.detectability,
                        'affected_deposits': risk['forms_affected'],
                        'mitigation': failure.mitigated_by
                    })

        # Format propagation paths
        if 'propagation_paths' in results:
            formatted['results']['loss_propagation'] = results['propagation_paths']

        # Format trends for finance properties
        if 'trends' in results:
            formatted['results']['component_health'] = self._format_health_trends(
                results['trends'], graph
            )

        return formatted

    def _score_to_risk_level(self, score: float) -> str:
        """
        Convert criticality score to finance risk level.

        Args:
            score: Criticality score (0-1)

        Returns:
            Risk level string
        """
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.3:
            return 'medium'
        else:
            return 'low'

    def _format_health_trends(
        self,
        trends: Dict[str, Dict[str, Dict[str, Any]]],
        graph: UniversalGraph
    ) -> List[Dict[str, Any]]:
        """
        Format health trends for finance components.

        Args:
            trends: Universal trend results
            graph: UniversalGraph instance

        Returns:
            List of component health trends
        """
        health_trends = []

        for form_id, property_trends in trends.items():
            if form_id in graph.form_elements:
                form = graph.form_elements[form_id]

                for property_name, trend in property_trends.items():
                    health_trends.append({
                        'component_id': form_id,
                        'deposit_type': form.type,
                        'depot_id': form.characteristics.get('depot_id'),
                        'property': property_name,
                        'trend': trend['direction'],
                        'rate_of_change': trend.get('rate_of_change_percent', 0),
                        'health_status': self._assess_health_status(property_name, trend)
                    })

        return health_trends

    def _assess_health_status(self, property_name: str, trend: Dict[str, Any]) -> str:
        """
        Assess component health based on property trends.

        Args:
            property_name: Name of the property
            trend: Trend information

        Returns:
            Health status string
        """
        direction = trend.get('direction', 'stable')
        rate = abs(trend.get('rate_of_change_percent', 0))

        # Exposure increasing rapidly = warning
        if property_name == 'exposure' and direction == 'increasing' and rate > 5:
            return 'warning'

        # Volatility increasing = degrading
        if property_name == 'volatility' and direction == 'increasing':
            return 'degrading'

        # Volume increasing rapidly = warning
        if property_name == 'volume' and direction == 'increasing' and rate > 10:
            return 'warning'

        # Stable or decreasing risk indicators = healthy
        if direction == 'stable' or (
            property_name in ['exposure', 'volatility', 'volume'] and direction == 'decreasing'
        ):
            return 'healthy'

        return 'normal'

    def validate_domain_data(self, domain_data: Dict[str, Any]) -> bool:
        """
        Validate finance domain data.

        Args:
            domain_data: Data to validate

        Returns:
            True if valid, False otherwise
        """
        # Check required fields
        if 'components' not in domain_data and 'risk_modes' not in domain_data:
            return False

        # Validate risk ratings are in range 1-10
        for rm in domain_data.get('risk_modes', []):
            severity = rm.get('severity', 0)
            occurrence = rm.get('occurrence', 0)
            detection = rm.get('detection', 0)

            if not (1 <= severity <= 10 and 1 <= occurrence <= 10 and 1 <= detection <= 10):
                return False

        return True

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get finance domain metadata.

        Returns:
            Metadata dictionary
        """
        return {
            'domain': 'finance',
            'version': '1.0',
            'standards': ['Risk FMEA', 'RCSA', 'Basel III', 'MiFID II'],
            'supported_analyses': [
                'loss_priority',
                'loss_propagation',
                'critical_deposits',
                'health_monitoring'
            ]
        }
