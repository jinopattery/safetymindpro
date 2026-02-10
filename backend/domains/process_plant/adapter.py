"""
Process Plant Domain Adapter

Implements the DomainAdapter interface for process plant monitoring and anomaly detection.
"""

from typing import Dict, List, Any, Optional
from backend.domains.base import (
    DomainAdapter, DomainNodeType, DomainEdgeType,
    DomainAlgorithm, StylingConfig
)
from backend.core.graph import NodeData, EdgeData, Graph
from backend.domains.process_plant.models import (
    Equipment, ProcessFlow, Sensor, Anomaly,
    EquipmentType, FlowType, AnomalyType
)
import networkx as nx
from collections import defaultdict


class FlowBalanceAnalysis(DomainAlgorithm):
    """Analyzes mass and energy balance in the process"""
    
    @property
    def name(self) -> str:
        return "flow_balance_analysis"
    
    @property
    def description(self) -> str:
        return "Checks mass and energy balance across equipment"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze flow balance"""
        tolerance = params.get('tolerance', 0.05) if params else 0.05  # 5% tolerance
        
        imbalances = []
        
        for node_id, node_data in graph.graph.nodes(data=True):
            if node_data.get('type') == 'equipment':
                # Calculate incoming and outgoing flows
                incoming_flow = 0.0
                outgoing_flow = 0.0
                
                # Check all edges connected to this node
                for pred in graph.graph.predecessors(node_id):
                    edge_data = graph.graph.edges[pred, node_id]
                    if edge_data.get('type') == 'mass_flow':
                        flow_rate = edge_data.get('attributes', {}).get('flow_rate', 0)
                        incoming_flow += flow_rate
                
                for succ in graph.graph.successors(node_id):
                    edge_data = graph.graph.edges[node_id, succ]
                    if edge_data.get('type') == 'mass_flow':
                        flow_rate = edge_data.get('attributes', {}).get('flow_rate', 0)
                        outgoing_flow += flow_rate
                
                # Check balance
                if incoming_flow > 0 or outgoing_flow > 0:
                    imbalance = abs(incoming_flow - outgoing_flow)
                    imbalance_percent = (imbalance / max(incoming_flow, outgoing_flow)) * 100 if max(incoming_flow, outgoing_flow) > 0 else 0
                    
                    # Update node attributes
                    graph.graph.nodes[node_id]['attributes']['incoming_flow'] = incoming_flow
                    graph.graph.nodes[node_id]['attributes']['outgoing_flow'] = outgoing_flow
                    graph.graph.nodes[node_id]['attributes']['flow_imbalance'] = imbalance_percent
                    graph.graph.nodes[node_id]['attributes']['flow_balanced'] = imbalance_percent <= (tolerance * 100)
                    
                    if imbalance_percent > (tolerance * 100):
                        imbalances.append({
                            'equipment_id': node_id,
                            'equipment_name': node_data.get('label', 'unknown'),
                            'incoming': incoming_flow,
                            'outgoing': outgoing_flow,
                            'imbalance_percent': round(imbalance_percent, 2)
                        })
        
        return {
            'imbalances': sorted(imbalances, key=lambda x: x['imbalance_percent'], reverse=True),
            'equipment_checked': len([n for n, d in graph.graph.nodes(data=True) if d.get('type') == 'equipment']),
            'tolerance_percent': tolerance * 100
        }


class AnomalyDetectionAnalysis(DomainAlgorithm):
    """Detects anomalies based on sensor readings and thresholds"""
    
    @property
    def name(self) -> str:
        return "anomaly_detection"
    
    @property
    def description(self) -> str:
        return "Detects operational anomalies from sensor data"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Detect anomalies"""
        detected_anomalies = []
        
        for node_id, node_data in graph.graph.nodes(data=True):
            node_type = node_data.get('type')
            attrs = node_data.get('attributes', {})
            
            # Check equipment for parameter violations
            if node_type == 'equipment':
                temperature = attrs.get('temperature')
                pressure = attrs.get('pressure')
                max_temp = attrs.get('design_temperature_max')
                max_pressure = attrs.get('design_pressure_max')
                
                anomaly_detected = False
                anomaly_types = []
                severity = 0
                
                if temperature is not None and max_temp is not None:
                    if temperature > max_temp:
                        anomaly_types.append('high_temperature')
                        temp_excess = ((temperature - max_temp) / max_temp) * 100
                        severity = max(severity, min(10, int(temp_excess / 10) + 5))
                        anomaly_detected = True
                
                if pressure is not None and max_pressure is not None:
                    if pressure > max_pressure:
                        anomaly_types.append('high_pressure')
                        pressure_excess = ((pressure - max_pressure) / max_pressure) * 100
                        severity = max(severity, min(10, int(pressure_excess / 10) + 5))
                        anomaly_detected = True
                
                if anomaly_detected:
                    graph.graph.nodes[node_id]['attributes']['has_anomaly'] = True
                    graph.graph.nodes[node_id]['attributes']['anomaly_types'] = anomaly_types
                    graph.graph.nodes[node_id]['attributes']['anomaly_severity'] = severity
                    
                    detected_anomalies.append({
                        'equipment_id': node_id,
                        'equipment_name': node_data.get('label', 'unknown'),
                        'anomaly_types': anomaly_types,
                        'severity': severity,
                        'temperature': temperature,
                        'pressure': pressure
                    })
            
            # Check sensors for out-of-range readings
            elif node_type == 'sensor':
                current_value = attrs.get('current_value')
                min_normal = attrs.get('min_normal')
                max_normal = attrs.get('max_normal')
                
                if current_value is not None:
                    if (min_normal is not None and current_value < min_normal) or \
                       (max_normal is not None and current_value > max_normal):
                        
                        deviation = 0
                        if min_normal is not None and current_value < min_normal:
                            deviation = ((min_normal - current_value) / min_normal) * 100
                        elif max_normal is not None and current_value > max_normal:
                            deviation = ((current_value - max_normal) / max_normal) * 100
                        
                        severity = min(10, int(deviation / 10) + 3)
                        
                        graph.graph.nodes[node_id]['attributes']['has_anomaly'] = True
                        graph.graph.nodes[node_id]['attributes']['anomaly_types'] = ['sensor_out_of_range']
                        graph.graph.nodes[node_id]['attributes']['anomaly_severity'] = severity
                        graph.graph.nodes[node_id]['attributes']['deviation_percent'] = round(deviation, 2)
                        
                        detected_anomalies.append({
                            'sensor_id': node_id,
                            'sensor_name': node_data.get('label', 'unknown'),
                            'anomaly_types': ['sensor_out_of_range'],
                            'severity': severity,
                            'current_value': current_value,
                            'expected_range': f"{min_normal}-{max_normal}",
                            'deviation_percent': round(deviation, 2)
                        })
        
        return {
            'anomalies': sorted(detected_anomalies, key=lambda x: x['severity'], reverse=True),
            'total_anomalies': len(detected_anomalies),
            'critical_anomalies': len([a for a in detected_anomalies if a['severity'] >= 7])
        }


class PropagationRiskAnalysis(DomainAlgorithm):
    """Analyzes how anomalies could propagate through the process"""
    
    @property
    def name(self) -> str:
        return "propagation_risk"
    
    @property
    def description(self) -> str:
        return "Analyzes downstream impact of equipment failures"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze propagation risk"""
        max_depth = params.get('max_depth', 5) if params else 5
        
        risk_propagations = []
        
        # Find equipment with anomalies
        anomaly_sources = [
            n for n, d in graph.graph.nodes(data=True)
            if d.get('type') == 'equipment' and d.get('attributes', {}).get('has_anomaly', False)
        ]
        
        for source in anomaly_sources:
            # Find all downstream equipment
            try:
                reachable = nx.single_source_shortest_path_length(
                    graph.graph, source, cutoff=max_depth
                )
                
                affected = []
                for target, depth in reachable.items():
                    if target != source:
                        target_data = graph.graph.nodes[target]
                        if target_data.get('type') == 'equipment':
                            affected.append({
                                'equipment_id': target,
                                'equipment_name': target_data.get('label', 'unknown'),
                                'propagation_depth': depth
                            })
                            
                            # Mark as at risk
                            if 'propagation_risk_from' not in graph.graph.nodes[target]['attributes']:
                                graph.graph.nodes[target]['attributes']['propagation_risk_from'] = []
                            graph.graph.nodes[target]['attributes']['propagation_risk_from'].append(source)
                
                if affected:
                    source_data = graph.graph.nodes[source]
                    risk_propagations.append({
                        'source_equipment': source,
                        'source_name': source_data.get('label', 'unknown'),
                        'affected_count': len(affected),
                        'affected_equipment': affected,
                        'max_depth': max([a['propagation_depth'] for a in affected])
                    })
            except:
                pass
        
        return {
            'propagation_risks': sorted(risk_propagations, key=lambda x: x['affected_count'], reverse=True),
            'total_risk_sources': len(risk_propagations)
        }


class ProcessPlantDomain(DomainAdapter):
    """
    Process plant monitoring and anomaly detection domain adapter.
    
    Supports equipment networks, flow analysis, and anomaly detection for industrial processes.
    """
    
    @property
    def domain_name(self) -> str:
        return "process_plant"
    
    @property
    def domain_display_name(self) -> str:
        return "Process Plant"
    
    @property
    def description(self) -> str:
        return "Process plant monitoring, flow analysis, and anomaly detection for industrial equipment and processes"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            DomainNodeType(
                name="equipment",
                display_name="Equipment",
                icon="⚙️",
                description="Process equipment (tanks, pumps, heat exchangers, etc.)",
                default_attributes={
                    "equipment_type": "tank",
                    "temperature": None,
                    "pressure": None,
                    "capacity": None,
                    "operational_status": "normal"
                }
            ),
            DomainNodeType(
                name="sensor",
                display_name="Sensor",
                icon="📡",
                description="Measurement point or sensor",
                default_attributes={
                    "sensor_type": "temperature",
                    "current_value": None,
                    "unit": None,
                    "min_normal": None,
                    "max_normal": None,
                    "status": "normal"
                }
            ),
            DomainNodeType(
                name="control_system",
                display_name="Control System",
                icon="🎛️",
                description="Control system or controller",
                default_attributes={
                    "controller_type": "PID",
                    "setpoint": None,
                    "mode": "auto"
                }
            ),
            DomainNodeType(
                name="anomaly",
                display_name="Anomaly",
                icon="🔴",
                description="Detected anomaly or fault",
                default_attributes={
                    "anomaly_type": "high_temperature",
                    "severity": 5,
                    "detected_value": None,
                    "expected_value": None
                }
            )
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            DomainEdgeType(
                name="mass_flow",
                display_name="Mass Flow",
                description="Material flow between equipment",
                directed=True,
                default_attributes={
                    "flow_rate": 0.0,  # kg/hr
                    "substance": None,
                    "temperature": None,
                    "pressure": None
                }
            ),
            DomainEdgeType(
                name="temperature_flow",
                display_name="Temperature Flow",
                description="Heat transfer or temperature relationship",
                directed=True,
                default_attributes={
                    "temperature": None,
                    "heat_transfer_rate": None
                }
            ),
            DomainEdgeType(
                name="pressure_signal",
                display_name="Pressure Signal",
                description="Pressure relationship or signal",
                directed=True,
                default_attributes={
                    "pressure": None
                }
            ),
            DomainEdgeType(
                name="control_signal",
                display_name="Control Signal",
                description="Control signal from controller to actuator",
                directed=True,
                default_attributes={
                    "signal_type": "analog",
                    "signal_value": None
                }
            ),
            DomainEdgeType(
                name="energy_flow",
                display_name="Energy Flow",
                description="Energy transfer between equipment",
                directed=True,
                default_attributes={
                    "energy_rate": None,  # kW
                    "energy_type": "thermal"
                }
            )
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={
                "equipment": {
                    "shape": "rectangle",
                    "backgroundColor": "#2c3e50",
                    "color": "#ffffff",
                    "borderColor": "#34495e",
                    "borderWidth": 2,
                    "fontSize": 13,
                    "padding": 12,
                    "borderRadius": 4
                },
                "sensor": {
                    "shape": "circle",
                    "backgroundColor": "#16a085",
                    "color": "#ffffff",
                    "borderColor": "#1abc9c",
                    "borderWidth": 2,
                    "fontSize": 11,
                    "padding": 8
                },
                "control_system": {
                    "shape": "hexagon",
                    "backgroundColor": "#8e44ad",
                    "color": "#ffffff",
                    "borderColor": "#9b59b6",
                    "borderWidth": 2,
                    "fontSize": 12,
                    "padding": 10
                },
                "anomaly": {
                    "shape": "star",
                    "backgroundColor": "#e74c3c",
                    "color": "#ffffff",
                    "borderColor": "#c0392b",
                    "borderWidth": 3,
                    "fontSize": 11,
                    "padding": 8,
                    "pulsate": True
                }
            },
            edge_styles={
                "mass_flow": {
                    "stroke": "#27ae60",
                    "strokeWidth": 3,
                    "animated": True,
                    "type": "smoothstep",
                    "arrowSize": 9
                },
                "temperature_flow": {
                    "stroke": "#e74c3c",
                    "strokeWidth": 2,
                    "strokeDasharray": "8,4",
                    "type": "step",
                    "arrowSize": 7
                },
                "pressure_signal": {
                    "stroke": "#3498db",
                    "strokeWidth": 2,
                    "type": "straight",
                    "arrowSize": 7
                },
                "control_signal": {
                    "stroke": "#9b59b6",
                    "strokeWidth": 1.5,
                    "strokeDasharray": "4,2",
                    "type": "smoothstep",
                    "arrowSize": 6
                },
                "energy_flow": {
                    "stroke": "#f39c12",
                    "strokeWidth": 2.5,
                    "animated": True,
                    "type": "step",
                    "arrowSize": 8
                }
            },
            theme={
                "name": "Process Plant",
                "primaryColor": "#2c3e50",
                "dangerColor": "#e74c3c",
                "successColor": "#27ae60",
                "backgroundColor": "#ecf0f1",
                "gridColor": "#bdc3c7"
            }
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            FlowBalanceAnalysis(),
            AnomalyDetectionAnalysis(),
            PropagationRiskAnalysis()
        ]
    
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate process plant node"""
        node_type = node_data.get('type')
        
        valid_types = [nt.name for nt in self.get_node_types()]
        if node_type not in valid_types:
            return False
        
        # Type-specific validation
        if node_type == 'sensor':
            attrs = node_data.get('attributes', {})
            min_normal = attrs.get('min_normal')
            max_normal = attrs.get('max_normal')
            
            # If both limits are set, min must be less than max
            if min_normal is not None and max_normal is not None:
                if min_normal >= max_normal:
                    return False
        
        elif node_type == 'anomaly':
            attrs = node_data.get('attributes', {})
            severity = attrs.get('severity', 5)
            
            # Severity must be 1-10
            if not (1 <= severity <= 10):
                return False
        
        return True
    
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate process plant edge"""
        edge_type = edge_data.get('type')
        
        valid_types = [et.name for et in self.get_edge_types()]
        if edge_type not in valid_types:
            return False
        
        # Type-specific validation
        if edge_type == 'mass_flow':
            attrs = edge_data.get('attributes', {})
            flow_rate = attrs.get('flow_rate', 0)
            
            # Flow rate must be non-negative
            if flow_rate < 0:
                return False
        
        return True
    
    def enrich_node(self, node: NodeData) -> NodeData:
        """Enrich process plant node with calculated attributes"""
        if node.type == 'equipment':
            attrs = node.attributes
            temp = attrs.get('temperature')
            pressure = attrs.get('pressure')
            max_temp = attrs.get('design_temperature_max')
            max_pressure = attrs.get('design_pressure_max')
            
            # Calculate utilization percentages
            if temp is not None and max_temp is not None and max_temp > 0:
                attrs['temperature_utilization'] = (temp / max_temp) * 100
            
            if pressure is not None and max_pressure is not None and max_pressure > 0:
                attrs['pressure_utilization'] = (pressure / max_pressure) * 100
            
            # Set operational status based on utilization
            temp_util = attrs.get('temperature_utilization', 0)
            pressure_util = attrs.get('pressure_utilization', 0)
            
            if temp_util > 100 or pressure_util > 100:
                attrs['operational_status'] = 'critical'
            elif temp_util > 90 or pressure_util > 90:
                attrs['operational_status'] = 'warning'
            else:
                attrs['operational_status'] = 'normal'
        
        return node
    
    def get_export_formats(self) -> List[str]:
        return ['json', 'excel', 'csv', 'graphml']
