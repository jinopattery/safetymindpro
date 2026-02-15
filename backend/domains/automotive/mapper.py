"""
Automotive Domain Mapper

Maps automotive safety concepts (FMEA, FTA) to the universal Form-Function-Failure graph.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.core.domain_mapper import DomainMapper
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode,
    FunctionBranch, FailurePropagationBranch
)


class AutomotiveMapper(DomainMapper):
    """
    Maps automotive concepts to universal graph.
    
    Mappings:
    - Component → FormElement (characteristics: part_number, material, supplier)
    - FMEA entry → FailureMode
    - Automotive function → Function
    - Component properties → Time-series data (temperature, vibration, wear)
    """
    
    @property
    def domain_name(self) -> str:
        return "automotive"
    
    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert automotive FMEA/FTA data to universal graph.
        
        Expected domain_data structure:
        {
            'components': [...],
            'failure_modes': [...],
            'functions': [...],
            'relationships': {...}
        }
        
        Args:
            domain_data: Automotive-specific data
            
        Returns:
            UniversalGraph instance
        """
        graph = UniversalGraph()
        graph.graph_metadata = {
            'domain': 'automotive',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Map components to form elements
        components = domain_data.get('components', [])
        for comp_data in components:
            form = self.map_form_element(comp_data)
            graph.add_form_element(form)
        
        # Map functions
        functions_data = domain_data.get('functions', [])
        for func_data in functions_data:
            function = self.map_function(func_data)
            graph.add_function(function)
        
        # Map failure modes (FMEA entries)
        failure_modes = domain_data.get('failure_modes', [])
        for fm_data in failure_modes:
            failure = self.map_failure_mode(fm_data)
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
        
        # Failure propagation
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
        Map automotive component to FormElement.
        
        Characteristics (static):
        - part_number: Component part number
        - material: Material composition
        - supplier: Supplier name
        - design_spec: Design specifications
        
        Properties (time-series):
        - temperature: Operating temperature
        - vibration: Vibration levels
        - wear: Wear measurements
        - pressure: Pressure readings
        
        Args:
            domain_element: Component data
            {
                'id': 'COMP_001',
                'type': 'brake_component',
                'part_number': 'BRK-12345',
                'material': 'steel',
                'supplier': 'Acme Corp',
                'properties': [
                    {'timestamp': '2024-01-01T00:00:00', 'temperature': 75.5, ...}
                ]
            }
            
        Returns:
            FormElement instance
        """
        element_id = domain_element.get('id', domain_element.get('component_id', 'unknown'))
        element_type = domain_element.get('type', 'component')
        
        form = FormElement(id=element_id, element_type=element_type)
        
        # Map static characteristics
        form.set_characteristic('part_number', domain_element.get('part_number'))
        form.set_characteristic('material', domain_element.get('material'))
        form.set_characteristic('supplier', domain_element.get('supplier'))
        form.set_characteristic('design_spec', domain_element.get('design_spec'))
        form.set_characteristic('subsystem', domain_element.get('subsystem'))
        
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
            
            # Add each property as a time-series sample
            for key, value in prop_sample.items():
                if key != 'timestamp':
                    form.add_property_sample(timestamp, key, value)
        
        return form
    
    def map_function(self, domain_function: Dict[str, Any]) -> Function:
        """
        Map automotive function to Function.
        
        Args:
            domain_function: Function data
            {
                'id': 'FUNC_001',
                'name': 'Brake Vehicle',
                'inputs': ['brake_pedal_force'],
                'outputs': ['braking_torque'],
                'performance': {'response_time': 0.2}
            }
            
        Returns:
            Function instance
        """
        func_id = domain_function.get('id', domain_function.get('function_id', 'unknown'))
        name = domain_function.get('name', 'Unknown Function')
        
        func = Function(id=func_id, name=name)
        func.inputs = domain_function.get('inputs', [])
        func.outputs = domain_function.get('outputs', [])
        func.performance_metrics = domain_function.get('performance', {})
        
        return func
    
    def map_failure_mode(self, domain_failure: Dict[str, Any]) -> FailureMode:
        """
        Map FMEA entry to FailureMode.
        
        Args:
            domain_failure: FMEA data
            {
                'id': 'FM_001',
                'failure_mode': 'Brake Pad Wear',
                'component': 'COMP_001',
                'severity': 8,
                'occurrence': 5,
                'detection': 3,
                'effects': ['Reduced braking'],
                'causes': ['Normal wear', 'Contamination'],
                'controls': ['Regular inspection']
            }
            
        Returns:
            FailureMode instance
        """
        failure_id = domain_failure.get('id', domain_failure.get('failure_id', 'unknown'))
        name = domain_failure.get('failure_mode', domain_failure.get('name', 'Unknown Failure'))
        
        failure = FailureMode(id=failure_id, name=name)
        
        # Map FMEA ratings
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
        
        # Map safety controls
        controls = domain_failure.get('controls', [])
        failure.mitigated_by = controls if isinstance(controls, list) else [controls]
        
        return failure
    
    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to automotive-specific format.
        
        Args:
            results: Universal algorithm results
            graph: UniversalGraph that was analyzed
            
        Returns:
            Automotive-specific formatted results
        """
        formatted = {
            'domain': 'automotive',
            'analysis_type': results.get('analysis_type', 'unknown'),
            'results': {}
        }
        
        # Format criticality scores as RPN-like values
        if 'criticality_scores' in results:
            formatted['results']['critical_components'] = []
            for form_id, score in results['criticality_scores'].items():
                if form_id in graph.form_elements:
                    form = graph.form_elements[form_id]
                    formatted['results']['critical_components'].append({
                        'component_id': form_id,
                        'component_type': form.type,
                        'part_number': form.characteristics.get('part_number'),
                        'criticality_score': score,
                        'risk_level': self._score_to_risk_level(score)
                    })
        
        # Format failure risks
        if 'risk_priorities' in results:
            formatted['results']['fmea_risks'] = []
            for risk in results['risk_priorities']:
                failure_id = risk['failure_id']
                if failure_id in graph.failure_modes:
                    failure = graph.failure_modes[failure_id]
                    formatted['results']['fmea_risks'].append({
                        'failure_mode': failure.name,
                        'rpn': int(risk['risk_score'] * 100),  # Scale to RPN-like value
                        'severity': failure.severity,
                        'occurrence': int(failure.probability * 10),
                        'detection': failure.detectability,
                        'affected_components': risk['forms_affected'],
                        'mitigation': failure.mitigated_by
                    })
        
        # Format propagation paths as FTA-like structure
        if 'propagation_paths' in results:
            formatted['results']['failure_propagation'] = results['propagation_paths']
        
        # Format trends for automotive properties
        if 'trends' in results:
            formatted['results']['component_health'] = self._format_health_trends(
                results['trends'], graph
            )
        
        return formatted
    
    def _score_to_risk_level(self, score: float) -> str:
        """
        Convert criticality score to automotive risk level.
        
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
        Format health trends for automotive components.
        
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
                        'component_type': form.type,
                        'part_number': form.characteristics.get('part_number'),
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
        
        # Temperature increasing rapidly = warning
        if property_name == 'temperature' and direction == 'increasing' and rate > 5:
            return 'warning'
        
        # Wear increasing = degrading
        if property_name == 'wear' and direction == 'increasing':
            return 'degrading'
        
        # Vibration increasing rapidly = warning
        if property_name == 'vibration' and direction == 'increasing' and rate > 10:
            return 'warning'
        
        # Stable or decreasing = healthy
        if direction == 'stable' or (property_name in ['wear', 'vibration', 'temperature'] and direction == 'decreasing'):
            return 'healthy'
        
        return 'normal'
    
    def validate_domain_data(self, domain_data: Dict[str, Any]) -> bool:
        """
        Validate automotive domain data.
        
        Args:
            domain_data: Data to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Check required fields
        if 'components' not in domain_data and 'failure_modes' not in domain_data:
            return False
        
        # Validate FMEA ratings are in range 1-10
        for fm in domain_data.get('failure_modes', []):
            severity = fm.get('severity', 0)
            occurrence = fm.get('occurrence', 0)
            detection = fm.get('detection', 0)
            
            if not (1 <= severity <= 10 and 1 <= occurrence <= 10 and 1 <= detection <= 10):
                return False
        
        return True
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get automotive domain metadata.
        
        Returns:
            Metadata dictionary
        """
        return {
            'domain': 'automotive',
            'version': '1.0',
            'standards': ['FMEA', 'FTA', 'ISO 26262'],
            'supported_analyses': [
                'risk_priority',
                'failure_propagation',
                'critical_components',
                'health_monitoring'
            ]
        }
