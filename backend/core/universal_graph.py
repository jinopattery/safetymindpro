"""
Universal Graph Core - Form-Function-Failure Architecture

This module implements the domain-independent graph structure based on the
Form-Function-Failure paradigm. It provides universal abstractions that work
across all domains (automotive, financial, process plant, etc.)
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
import networkx as nx
from copy import deepcopy


class TimeSeriesData:
    """
    Time-series property data for dynamic/time-varying attributes.
    
    Examples:
    - Automotive: temperature, vibration, wear
    - Financial: balance, transaction_count, risk_score
    - Process Plant: temperature, pressure, flow_rate
    """
    
    def __init__(self):
        self.timestamps: List[datetime] = []
        self.values: Dict[str, List[Any]] = {}
    
    def add(self, timestamp: datetime, property_name: str, value: Any) -> None:
        """
        Add a time-series data point
        
        Args:
            timestamp: Time of measurement
            property_name: Name of the property (e.g., 'temperature')
            value: Value at that time
        """
        if property_name not in self.values:
            self.values[property_name] = []
        
        self.values[property_name].append(value)
        if timestamp not in self.timestamps:
            self.timestamps.append(timestamp)
    
    def get_range(self, property_name: str, start: datetime, end: datetime) -> List[Any]:
        """
        Get values within a time range
        
        Args:
            property_name: Name of the property
            start: Start time
            end: End time
            
        Returns:
            List of values within the time range
        """
        if property_name not in self.values:
            return []
        
        result = []
        for i, ts in enumerate(self.timestamps):
            if start <= ts <= end and i < len(self.values[property_name]):
                result.append(self.values[property_name][i])
        
        return result
    
    def get_latest(self, property_name: str) -> Optional[Any]:
        """
        Get the latest value for a property
        
        Args:
            property_name: Name of the property
            
        Returns:
            Latest value or None if no data
        """
        if property_name not in self.values or not self.values[property_name]:
            return None
        
        return self.values[property_name][-1]
    
    def detect_anomalies(self, property_name: str, threshold: float = 2.0) -> List[int]:
        """
        Detect anomalies using simple statistical method
        
        Args:
            property_name: Name of the property
            threshold: Number of standard deviations for anomaly detection
            
        Returns:
            List of indices where anomalies were detected
        """
        if property_name not in self.values:
            return []
        
        values = self.values[property_name]
        if len(values) < 3:
            return []
        
        # Simple anomaly detection using mean and std
        try:
            numeric_values = [float(v) for v in values]
            mean = sum(numeric_values) / len(numeric_values)
            variance = sum((x - mean) ** 2 for x in numeric_values) / len(numeric_values)
            std = variance ** 0.5
            
            if std == 0:
                return []
            
            anomalies = []
            for i, value in enumerate(numeric_values):
                z_score = abs((value - mean) / std)
                if z_score > threshold:
                    anomalies.append(i)
            
            return anomalies
        except (ValueError, TypeError):
            # Non-numeric data, skip anomaly detection
            return []
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'timestamps': [ts.isoformat() for ts in self.timestamps],
            'values': self.values
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TimeSeriesData':
        """Deserialize from dictionary"""
        ts_data = cls()
        ts_data.timestamps = [datetime.fromisoformat(ts) for ts in data.get('timestamps', [])]
        ts_data.values = data.get('values', {})
        return ts_data


class FormElement:
    """
    Universal form element (node in the graph).
    Represents physical or logical structure.
    
    Examples:
    - Automotive: Component, Subsystem
    - Financial: Account, Portfolio
    - Process Plant: Equipment, Vessel
    """
    
    def __init__(self, id: str, element_type: str):
        self.id = id
        self.type = element_type
        self.characteristics: Dict[str, Any] = {}  # Static/constant properties
        self.properties: TimeSeriesData = TimeSeriesData()  # Dynamic/time-varying properties
    
    def set_characteristic(self, name: str, value: Any) -> None:
        """
        Set a static/constant characteristic
        
        Args:
            name: Characteristic name (e.g., 'material', 'part_number')
            value: Characteristic value
        """
        self.characteristics[name] = value
    
    def add_property_sample(self, timestamp: datetime, name: str, value: Any) -> None:
        """
        Add a time-series property sample
        
        Args:
            timestamp: Time of measurement
            name: Property name (e.g., 'temperature')
            value: Property value
        """
        self.properties.add(timestamp, name, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'type': self.type,
            'characteristics': self.characteristics,
            'properties': self.properties.to_dict()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FormElement':
        """Deserialize from dictionary"""
        element = cls(data['id'], data['type'])
        element.characteristics = data.get('characteristics', {})
        if 'properties' in data:
            element.properties = TimeSeriesData.from_dict(data['properties'])
        return element


class Function:
    """
    Universal function in the function tree.
    Represents what the system DOES (behavioral structure).
    
    Examples:
    - Automotive: "Brake", "Decelerate Vehicle"
    - Financial: "Process Transaction", "Verify Funds"
    - Process Plant: "Heat Fluid", "Control Pressure"
    """
    
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name
        self.parent_function: Optional['Function'] = None
        self.children: List['Function'] = []
        self.inputs: List[str] = []
        self.outputs: List[str] = []
        self.performance_metrics: Dict[str, Any] = {}
    
    def add_child(self, child_function: 'Function') -> None:
        """
        Add a child function (decomposition)
        
        Args:
            child_function: Child function to add
        """
        self.children.append(child_function)
        child_function.parent_function = self
    
    def get_ancestors(self) -> List['Function']:
        """
        Get all ancestor functions
        
        Returns:
            List of ancestor functions from parent to root
        """
        ancestors = []
        current = self.parent_function
        while current is not None:
            ancestors.append(current)
            current = current.parent_function
        return ancestors
    
    def get_descendants(self) -> List['Function']:
        """
        Get all descendant functions
        
        Returns:
            List of all descendant functions
        """
        descendants = []
        for child in self.children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'parent_function': self.parent_function.id if self.parent_function else None,
            'children': [child.id for child in self.children],
            'inputs': self.inputs,
            'outputs': self.outputs,
            'performance_metrics': self.performance_metrics
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Function':
        """Deserialize from dictionary (without relationships)"""
        func = cls(data['id'], data['name'])
        func.inputs = data.get('inputs', [])
        func.outputs = data.get('outputs', [])
        func.performance_metrics = data.get('performance_metrics', {})
        return func


class FailureMode:
    """
    Universal failure mode.
    Represents what can go WRONG (exception/risk structure).
    
    Examples:
    - Automotive: "Brake Failure", "Piston Seizure"
    - Financial: "Fraudulent Transaction", "Insufficient Funds"
    - Process Plant: "Overpressure", "Leak"
    """
    
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name
        self.probability: float = 0.0  # 0.0 to 1.0
        self.severity: int = 0  # Domain-specific scale
        self.detectability: int = 0  # Domain-specific scale
        self.affects_functions: List[str] = []  # Function IDs
        self.affects_forms: List[str] = []  # FormElement IDs
        self.propagates_to: List[str] = []  # FailureMode IDs
        self.mitigated_by: List[str] = []  # Safety mechanisms
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'probability': self.probability,
            'severity': self.severity,
            'detectability': self.detectability,
            'affects_functions': self.affects_functions,
            'affects_forms': self.affects_forms,
            'propagates_to': self.propagates_to,
            'mitigated_by': self.mitigated_by
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FailureMode':
        """Deserialize from dictionary"""
        failure = cls(data['id'], data['name'])
        failure.probability = data.get('probability', 0.0)
        failure.severity = data.get('severity', 0)
        failure.detectability = data.get('detectability', 0)
        failure.affects_functions = data.get('affects_functions', [])
        failure.affects_forms = data.get('affects_forms', [])
        failure.propagates_to = data.get('propagates_to', [])
        failure.mitigated_by = data.get('mitigated_by', [])
        return failure


class FunctionBranch:
    """
    Edge in the function tree with characteristics.
    Represents connection between functions.
    """
    
    def __init__(self, source_function: Function, target_function: Function):
        self.source_function = source_function
        self.target_function = target_function
        self.connection_type: str = 'sequential'  # sequential, parallel, conditional
        self.reliability: float = 1.0
        self.latency: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'source': self.source_function.id,
            'target': self.target_function.id,
            'connection_type': self.connection_type,
            'reliability': self.reliability,
            'latency': self.latency
        }


class FailurePropagationBranch:
    """
    Edge in the failure tree.
    Represents how failures propagate.
    """
    
    def __init__(self, source_failure: FailureMode, target_failure: FailureMode):
        self.source_failure = source_failure
        self.target_failure = target_failure
        self.propagation_probability: float = 1.0
        self.propagation_mechanism: str = ''
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            'source': self.source_failure.id,
            'target': self.target_failure.id,
            'propagation_probability': self.propagation_probability,
            'propagation_mechanism': self.propagation_mechanism
        }


class UniversalGraph:
    """
    Domain-independent graph structure.
    
    Implements the Form-Function-Failure paradigm:
    - Form Layer: Physical/logical structure (nodes)
    - Function Layer: Behavioral structure (what it does)
    - Failure Layer: Risk structure (what can go wrong)
    """
    
    def __init__(self):
        self.form_elements: Dict[str, FormElement] = {}
        self.functions: Dict[str, Function] = {}
        self.failure_modes: Dict[str, FailureMode] = {}
        self.function_branches: List[FunctionBranch] = []
        self.failure_branches: List[FailurePropagationBranch] = []
        self.graph: nx.MultiDiGraph = nx.MultiDiGraph()
        
        # Additional metadata about the graph (domain info, timestamps, etc.)
        # Renamed from 'metadata' to avoid SQLAlchemy reserved attribute conflict
        self.graph_metadata: Dict[str, Any] = {}
    
    def add_form_element(self, element: FormElement) -> None:
        """
        Add a form element to the graph
        
        Args:
            element: FormElement to add
        """
        self.form_elements[element.id] = element
        self.graph.add_node(element.id, layer='form', data=element)
    
    def add_function(self, function: Function) -> None:
        """
        Add a function to the function tree
        
        Args:
            function: Function to add
        """
        self.functions[function.id] = function
        self.graph.add_node(function.id, layer='function', data=function)
    
    def add_failure_mode(self, failure: FailureMode) -> None:
        """
        Add a failure mode to the failure tree
        
        Args:
            failure: FailureMode to add
        """
        self.failure_modes[failure.id] = failure
        self.graph.add_node(failure.id, layer='failure', data=failure)
    
    def link_form_to_function(self, form_id: str, function_id: str, **attrs) -> None:
        """
        Link a form element to a function it performs
        
        Args:
            form_id: FormElement ID
            function_id: Function ID
            **attrs: Additional edge attributes
        """
        if form_id in self.form_elements and function_id in self.functions:
            self.graph.add_edge(form_id, function_id, relation='performs', **attrs)
    
    def link_function_to_failure(self, function_id: str, failure_id: str, **attrs) -> None:
        """
        Link a function to a failure mode
        
        Args:
            function_id: Function ID
            failure_id: FailureMode ID
            **attrs: Additional edge attributes
        """
        if function_id in self.functions and failure_id in self.failure_modes:
            self.graph.add_edge(function_id, failure_id, relation='has_failure', **attrs)
            
            # Also update the failure mode's affects_functions list
            if function_id not in self.failure_modes[failure_id].affects_functions:
                self.failure_modes[failure_id].affects_functions.append(function_id)
    
    def link_form_to_failure(self, form_id: str, failure_id: str, **attrs) -> None:
        """
        Link a form element to a failure mode
        
        Args:
            form_id: FormElement ID
            failure_id: FailureMode ID
            **attrs: Additional edge attributes
        """
        if form_id in self.form_elements and failure_id in self.failure_modes:
            self.graph.add_edge(form_id, failure_id, relation='has_failure', **attrs)
            
            # Also update the failure mode's affects_forms list
            if form_id not in self.failure_modes[failure_id].affects_forms:
                self.failure_modes[failure_id].affects_forms.append(form_id)
    
    def add_function_branch(self, branch: FunctionBranch) -> None:
        """
        Add a function branch (edge in function tree)
        
        Args:
            branch: FunctionBranch to add
        """
        self.function_branches.append(branch)
        self.graph.add_edge(
            branch.source_function.id,
            branch.target_function.id,
            relation='function_flow',
            connection_type=branch.connection_type,
            reliability=branch.reliability,
            latency=branch.latency
        )
    
    def add_failure_branch(self, branch: FailurePropagationBranch) -> None:
        """
        Add a failure propagation branch
        
        Args:
            branch: FailurePropagationBranch to add
        """
        self.failure_branches.append(branch)
        self.graph.add_edge(
            branch.source_failure.id,
            branch.target_failure.id,
            relation='propagates_to',
            propagation_probability=branch.propagation_probability,
            propagation_mechanism=branch.propagation_mechanism
        )
        
        # Also update the failure mode's propagates_to list
        if branch.target_failure.id not in self.failure_modes[branch.source_failure.id].propagates_to:
            self.failure_modes[branch.source_failure.id].propagates_to.append(branch.target_failure.id)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize the universal graph to dictionary
        
        Returns:
            Dictionary representation of the graph
        """
        return {
            'form_elements': {fid: fe.to_dict() for fid, fe in self.form_elements.items()},
            'functions': {fid: f.to_dict() for fid, f in self.functions.items()},
            'failure_modes': {fid: fm.to_dict() for fid, fm in self.failure_modes.items()},
            'function_branches': [fb.to_dict() for fb in self.function_branches],
            'failure_branches': [fb.to_dict() for fb in self.failure_branches],
            'graph_metadata': self.graph_metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UniversalGraph':
        """
        Deserialize from dictionary
        
        Args:
            data: Dictionary representation
            
        Returns:
            UniversalGraph instance
        """
        graph = cls()
        graph.graph_metadata = data.get('graph_metadata', data.get('metadata', {}))  # Support old 'metadata' key for backward compatibility
        
        # Restore form elements
        for form_data in data.get('form_elements', {}).values():
            element = FormElement.from_dict(form_data)
            graph.add_form_element(element)
        
        # Restore functions
        functions_data = data.get('functions', {})
        for func_data in functions_data.values():
            function = Function.from_dict(func_data)
            graph.add_function(function)
        
        # Restore function relationships
        for func_data in functions_data.values():
            func_id = func_data['id']
            parent_id = func_data.get('parent_function')
            if parent_id and parent_id in graph.functions:
                graph.functions[parent_id].add_child(graph.functions[func_id])
        
        # Restore failure modes
        for failure_data in data.get('failure_modes', {}).values():
            failure = FailureMode.from_dict(failure_data)
            graph.add_failure_mode(failure)
        
        # Restore function branches
        for branch_data in data.get('function_branches', []):
            source_id = branch_data['source']
            target_id = branch_data['target']
            if source_id in graph.functions and target_id in graph.functions:
                branch = FunctionBranch(graph.functions[source_id], graph.functions[target_id])
                branch.connection_type = branch_data.get('connection_type', 'sequential')
                branch.reliability = branch_data.get('reliability', 1.0)
                branch.latency = branch_data.get('latency', 0.0)
                graph.add_function_branch(branch)
        
        # Restore failure branches
        for branch_data in data.get('failure_branches', []):
            source_id = branch_data['source']
            target_id = branch_data['target']
            if source_id in graph.failure_modes and target_id in graph.failure_modes:
                branch = FailurePropagationBranch(
                    graph.failure_modes[source_id],
                    graph.failure_modes[target_id]
                )
                branch.propagation_probability = branch_data.get('propagation_probability', 1.0)
                branch.propagation_mechanism = branch_data.get('propagation_mechanism', '')
                graph.add_failure_branch(branch)
        
        return graph
