"""
Process Plant Domain Mapper

Maps process plant concepts (HAZOP, P&ID) to the universal Form-Function-Failure graph.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.core.domain_mapper import DomainMapper
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode,
    FunctionBranch, FailurePropagationBranch
)


class ProcessPlantMapper(DomainMapper):
    """
    Maps process plant concepts to universal graph.
    
    Mappings:
    - Equipment → FormElement (characteristics: capacity, design_pressure, material)
    - HAZOP deviation → FailureMode
    - Process function → Function
    - Equipment properties → Time-series data (temperature, pressure, flow_rate)
    """
    
    @property
    def domain_name(self) -> str:
        return "process_plant"
    
    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert process plant data to universal graph.
        
        Expected domain_data structure:
        {
            'equipment': [...],
            'hazards': [...],
            'functions': [...],
            'relationships': {...}
        }
        """
        graph = UniversalGraph()
        graph.metadata = {
            'domain': 'process_plant',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Map equipment to form elements
        equipment_list = domain_data.get('equipment', [])
        for equip_data in equipment_list:
            form = self.map_form_element(equip_data)
            graph.add_form_element(form)
        
        # Map functions
        functions_data = domain_data.get('functions', [])
        for func_data in functions_data:
            function = self.map_function(func_data)
            graph.add_function(function)
        
        # Map hazards/deviations to failure modes
        hazards = domain_data.get('hazards', [])
        for hazard_data in hazards:
            failure = self.map_failure_mode(hazard_data)
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
        Map process equipment to FormElement.
        
        Characteristics (static):
        - capacity: Design capacity
        - design_pressure: Maximum design pressure
        - material: Material of construction
        - design_temperature: Design temperature
        
        Properties (time-series):
        - temperature: Operating temperature
        - pressure: Operating pressure
        - flow_rate: Flow rate
        - level: Tank/vessel level
        """
        element_id = domain_element.get('id', domain_element.get('equipment_id', 'unknown'))
        element_type = domain_element.get('type', 'equipment')
        
        form = FormElement(id=element_id, element_type=element_type)
        
        # Map static characteristics
        form.set_characteristic('capacity', domain_element.get('capacity'))
        form.set_characteristic('design_pressure', domain_element.get('design_pressure'))
        form.set_characteristic('material', domain_element.get('material'))
        form.set_characteristic('design_temperature', domain_element.get('design_temperature'))
        form.set_characteristic('tag_number', domain_element.get('tag_number'))
        
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
        Map process function to Function.
        
        Examples:
        - "Heat Fluid"
        - "Transfer Material"
        - "Control Pressure"
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
        Map HAZOP deviation to FailureMode.
        
        Args:
            domain_failure: HAZOP/hazard data
            {
                'id': 'HAZ_001',
                'deviation': 'Overpressure',
                'guideword': 'More Pressure',
                'equipment': 'EQ_001',
                'severity': 9,
                'likelihood': 0.3,
                'safeguards': ['Pressure relief valve']
            }
        """
        failure_id = domain_failure.get('id', domain_failure.get('hazard_id', 'unknown'))
        name = domain_failure.get('deviation', domain_failure.get('name', 'Unknown Hazard'))
        
        failure = FailureMode(id=failure_id, name=name)
        
        # Map hazard ratings
        failure.severity = domain_failure.get('severity', 5)
        failure.probability = domain_failure.get('likelihood', 0.5)
        failure.detectability = domain_failure.get('detectability', 5)
        
        # Map relationships
        equipment_id = domain_failure.get('equipment')
        if equipment_id:
            failure.affects_forms = [equipment_id]
        
        # Map safeguards
        safeguards = domain_failure.get('safeguards', [])
        failure.mitigated_by = safeguards if isinstance(safeguards, list) else [safeguards]
        
        return failure
    
    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to process plant format.
        """
        formatted = {
            'domain': 'process_plant',
            'analysis_type': results.get('analysis_type', 'unknown'),
            'results': {}
        }
        
        # Format criticality scores
        if 'criticality_scores' in results:
            formatted['results']['critical_equipment'] = []
            for form_id, score in results['criticality_scores'].items():
                if form_id in graph.form_elements:
                    form = graph.form_elements[form_id]
                    formatted['results']['critical_equipment'].append({
                        'equipment_id': form_id,
                        'equipment_type': form.type,
                        'tag_number': form.characteristics.get('tag_number'),
                        'criticality_score': score,
                        'risk_level': self._score_to_risk_level(score)
                    })
        
        # Format hazard risks
        if 'risk_priorities' in results:
            formatted['results']['hazard_risks'] = []
            for risk in results['risk_priorities']:
                failure_id = risk['failure_id']
                if failure_id in graph.failure_modes:
                    failure = graph.failure_modes[failure_id]
                    formatted['results']['hazard_risks'].append({
                        'hazard': failure.name,
                        'risk_score': risk['risk_score'],
                        'severity': failure.severity,
                        'likelihood': failure.probability,
                        'affected_equipment': risk['forms_affected'],
                        'safeguards': failure.mitigated_by
                    })
        
        # Format process health trends
        if 'trends' in results:
            formatted['results']['process_health'] = self._format_process_trends(
                results['trends'], graph
            )
        
        return formatted
    
    def _score_to_risk_level(self, score: float) -> str:
        """Convert criticality score to risk level."""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.3:
            return 'medium'
        else:
            return 'low'
    
    def _format_process_trends(
        self,
        trends: Dict[str, Dict[str, Dict[str, Any]]],
        graph: UniversalGraph
    ) -> List[Dict[str, Any]]:
        """Format process parameter trends."""
        process_trends = []
        
        for form_id, property_trends in trends.items():
            if form_id in graph.form_elements:
                form = graph.form_elements[form_id]
                
                for property_name, trend in property_trends.items():
                    process_trends.append({
                        'equipment_id': form_id,
                        'equipment_type': form.type,
                        'tag_number': form.characteristics.get('tag_number'),
                        'parameter': property_name,
                        'trend': trend['direction'],
                        'rate_of_change': trend.get('rate_of_change_percent', 0),
                        'status': self._assess_process_status(property_name, trend, form)
                    })
        
        return process_trends
    
    def _assess_process_status(
        self,
        property_name: str,
        trend: Dict[str, Any],
        form: FormElement
    ) -> str:
        """Assess process parameter status."""
        direction = trend.get('direction', 'stable')
        rate = abs(trend.get('rate_of_change_percent', 0))
        
        # Check against design limits
        if property_name == 'pressure':
            design_pressure = form.characteristics.get('design_pressure', float('inf'))
            latest_pressure = form.properties.get_latest('pressure')
            if latest_pressure and latest_pressure > design_pressure * 0.9:
                return 'warning'
        
        if property_name == 'temperature':
            design_temp = form.characteristics.get('design_temperature', float('inf'))
            latest_temp = form.properties.get_latest('temperature')
            if latest_temp and latest_temp > design_temp * 0.9:
                return 'warning'
        
        # Rapid changes are concerning
        if rate > 10:
            return 'warning'
        
        return 'normal'
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get process plant domain metadata."""
        return {
            'domain': 'process_plant',
            'version': '1.0',
            'standards': ['HAZOP', 'LOPA', 'P&ID'],
            'supported_analyses': [
                'hazard_analysis',
                'process_safety',
                'equipment_criticality',
                'process_monitoring'
            ]
        }
