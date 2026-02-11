# 🏗️ Universal Graph-Based Architecture for SafetyMindPro

## 🎯 Core Concept: Form-Function-Failure Paradigm

**Key Insight:** Every domain problem can be modeled as a graph of **Form-Function-Failure** relationships, independent of the specific domain.

---

## 📐 Fundamental Abstractions

### 1. Form Elements (Nodes)
**Analogy:** Files in software engineering

**Properties:**
- **Time-Series Data**: Dynamic properties that change over time
  - Temperature, pressure, voltage, balance, price
  - Measured at discrete time intervals
  - Can have trends, anomalies, forecasts

- **Characteristics**: Static/constant properties
  - Type, capacity, material, rating
  - Design specifications
  - Immutable attributes

**Structure:**
```python
FormElement {
    id: str
    type: str
    
    # Static properties (constants)
    characteristics: {
        capacity: float,
        material: str,
        rating: str,
        design_spec: dict
    }
    
    # Dynamic properties (time-series)
    properties: TimeSeries {
        timestamp: datetime,
        values: {
            temperature: float,
            pressure: float,
            voltage: float,
            ...
        }
    }
}
```

### 2. Function Tree (Directed Graph)
**Analogy:** Function calls in software

**Represents:**
- What the form element DOES
- How functions connect/depend on each other
- Hierarchical decomposition of system behavior

**Structure:**
```python
Function {
    id: str
    name: str
    parent_function: str (optional)
    depends_on: List[Function]
    
    # Input/Output specification
    inputs: List[str]
    outputs: List[str]
    
    # Performance characteristics
    performance_metrics: dict
}

FunctionBranch {
    source_function: Function
    target_function: Function
    
    # Branch characteristics
    connection_type: str  # sequential, parallel, conditional
    reliability: float
    latency: float
}
```

### 3. Failure Mode Tree (Exception Paths)
**Analogy:** Exception handling in software

**Represents:**
- What can go WRONG
- How failures propagate
- Exception handling paths

**Structure:**
```python
FailureMode {
    id: str
    name: str
    affects_function: Function
    affects_form: FormElement
    
    # Failure characteristics
    probability: float
    severity: int
    detectability: int
    
    # Propagation
    triggers: List[FailureMode]
    mitigated_by: List[SafetyMechanism]
}
```

---

## 🌳 Universal Graph Structure

```
SYSTEM GRAPH
│
├─── FORM LAYER (Physical/Logical Structure)
│    │
│    ├─── FormElement[1]
│    │    ├─ characteristics: {...}
│    │    └─ properties: TimeSeries[...]
│    │
│    ├─── FormElement[2]
│    └─── FormElement[n]
│
├─── FUNCTION LAYER (Behavioral Structure)
│    │
│    ├─── FunctionTree
│    │    ├─ Function[A] → Function[B]
│    │    ├─ Function[B] → Function[C]
│    │    └─ Function[C] → Function[D]
│    │
│    └─── FunctionBranches (edges with characteristics)
│
└─── FAILURE LAYER (Exception/Risk Structure)
     │
     ├─── FailureModeTree
     │    ├─ FailureMode[1] → FailureMode[2]
     │    └─ FailureMode[2] → FailureMode[3]
     │
     └─── FailurePropagationBranches
```

---

## 🔄 Domain-Independent Algorithms

All algorithms operate on the **universal graph** structure:

### 1. **Structural Analysis** (Form-centric)
```python
# Works on ANY domain
def analyze_structure(graph):
    """
    - Component criticality
    - Dependency analysis
    - Bottleneck identification
    """
    return structural_metrics
```

### 2. **Functional Analysis** (Function-centric)
```python
def analyze_functions(function_tree):
    """
    - Function flow analysis
    - Performance bottlenecks
    - Redundancy analysis
    """
    return functional_metrics
```

### 3. **Risk Analysis** (Failure-centric)
```python
def analyze_failures(failure_tree, function_tree, form_graph):
    """
    - Failure propagation
    - Risk prioritization
    - Critical paths
    """
    return risk_metrics
```

### 4. **Time-Series Analysis** (Property-centric)
```python
def analyze_timeseries(form_elements):
    """
    - Anomaly detection
    - Trend analysis
    - Predictive modeling
    """
    return timeseries_metrics
```

---

## 🎨 Domain Mapping

Domains only provide **mapping** from domain concepts to universal structure:

### Automotive Domain Mapping
```yaml
domain: automotive

form_mapping:
  Component → FormElement
    characteristics: [part_number, material, supplier]
    properties: [vibration, temperature, wear]
  
function_mapping:
  "Brake" → Function
  "Decelerate Vehicle" → Function
  "Lock Wheel" → Function
  
failure_mapping:
  "Brake Failure" → FailureMode
  "Piston Seizure" → FailureMode
```

### Financial Domain Mapping
```yaml
domain: financial

form_mapping:
  Account → FormElement
    characteristics: [type, owner, institution]
    properties: [balance, transaction_count, risk_score]
  
function_mapping:
  "Process Transaction" → Function
  "Verify Funds" → Function
  "Update Balance" → Function
  
failure_mapping:
  "Fraudulent Transaction" → FailureMode
  "Insufficient Funds" → FailureMode
```

### Process Plant Domain Mapping
```yaml
domain: process_plant

form_mapping:
  Equipment → FormElement
    characteristics: [capacity, design_pressure, material]
    properties: [temperature, pressure, flow_rate]
  
function_mapping:
  "Heat Fluid" → Function
  "Transfer Material" → Function
  "Control Pressure" → Function
  
failure_mapping:
  "Overpressure" → FailureMode
  "Leak" → FailureMode
```

---

## 💻 Implementation Architecture

### Core Layer (Domain-Independent)

```python
# backend/core/universal_graph.py

class UniversalGraph:
    """
    Domain-independent graph structure
    """
    
    def __init__(self):
        self.form_elements = {}      # Physical/logical structure
        self.functions = {}          # Behavioral structure
        self.failure_modes = {}      # Risk structure
        self.graph = nx.MultiDiGraph()
    
    def add_form_element(self, element: FormElement):
        """Add form element (node)"""
        pass
    
    def add_function(self, function: Function):
        """Add function to function tree"""
        pass
    
    def add_failure_mode(self, failure: FailureMode):
        """Add failure mode to failure tree"""
        pass
    
    def link_form_to_function(self, form_id, function_id):
        """Form element performs function"""
        pass
    
    def link_function_to_failure(self, function_id, failure_id):
        """Function has failure mode"""
        pass


class FormElement:
    """Universal form element"""
    
    def __init__(self, id, element_type):
        self.id = id
        self.type = element_type
        self.characteristics = {}  # Constants
        self.properties = TimeSeriesData()  # Time-varying
    
    def set_characteristic(self, name, value):
        """Set static property"""
        self.characteristics[name] = value
    
    def add_property_sample(self, timestamp, name, value):
        """Add time-series data point"""
        self.properties.add(timestamp, name, value)


class Function:
    """Universal function"""
    
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.parent = None
        self.children = []
        self.inputs = []
        self.outputs = []
        self.performance = {}
    
    def add_child(self, child_function):
        """Decompose function"""
        self.children.append(child_function)
        child_function.parent = self


class FailureMode:
    """Universal failure mode"""
    
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.probability = 0.0
        self.severity = 0
        self.detectability = 0
        self.affects_functions = []
        self.affects_forms = []
        self.propagates_to = []
```

### Domain Layer (Mapping Only)

```python
# backend/domains/automotive/mapper.py

class AutomotiveDomainMapper:
    """
    Maps automotive concepts to universal graph
    """
    
    @staticmethod
    def map_component_to_form(component_data) -> FormElement:
        """Map automotive component to form element"""
        form = FormElement(
            id=component_data['id'],
            element_type='physical_component'
        )
        
        # Map characteristics (constants)
        form.set_characteristic('part_number', component_data.get('part_number'))
        form.set_characteristic('material', component_data.get('material'))
        form.set_characteristic('supplier', component_data.get('supplier'))
        
        return form
    
    @staticmethod
    def map_fmea_to_failure(fmea_data) -> FailureMode:
        """Map FMEA data to failure mode"""
        failure = FailureMode(
            id=fmea_data['id'],
            name=fmea_data['failure_mode']
        )
        
        failure.severity = fmea_data.get('severity', 5)
        failure.probability = fmea_data.get('occurrence', 5) / 10.0
        failure.detectability = fmea_data.get('detection', 5)
        
        return failure
    
    @staticmethod
    def create_function_tree(system_data) -> List[Function]:
        """Create function decomposition"""
        # Map automotive functions to universal functions
        pass
```

### Algorithm Layer (Domain-Independent)

```python
# backend/algorithms/structural_analysis.py

def compute_criticality(graph: UniversalGraph) -> dict:
    """
    Domain-independent criticality analysis
    Works for ANY domain
    """
    
    # Analyze form layer
    form_centrality = nx.betweenness_centrality(graph.graph)
    
    # Analyze function layer
    function_flows = analyze_function_dependencies(graph.functions)
    
    # Analyze failure layer
    failure_impacts = compute_failure_propagation(graph.failure_modes)
    
    # Combine metrics
    criticality_scores = {}
    for form_id in graph.form_elements:
        score = (
            form_centrality.get(form_id, 0) * 0.3 +
            function_flows.get(form_id, 0) * 0.4 +
            failure_impacts.get(form_id, 0) * 0.3
        )
        criticality_scores[form_id] = score
    
    return criticality_scores


def analyze_failure_propagation(graph: UniversalGraph) -> dict:
    """
    Domain-independent failure analysis
    """
    
    propagation_paths = []
    
    for failure_id, failure in graph.failure_modes.items():
        # Trace propagation through failure tree
        affected_functions = trace_function_impact(failure, graph)
        affected_forms = trace_form_impact(failure, graph)
        
        propagation_paths.append({
            'failure': failure_id,
            'functions_affected': affected_functions,
            'forms_affected': affected_forms,
            'severity': failure.severity,
            'probability': failure.probability
        })
    
    return propagation_paths
```

---

## 🔄 Data Flow

```
USER INPUT (Domain-Specific)
      ↓
DOMAIN MAPPER
      ↓
UNIVERSAL GRAPH (Form-Function-Failure)
      ↓
DOMAIN-INDEPENDENT ALGORITHMS
      ↓
UNIVERSAL RESULTS
      ↓
DOMAIN FORMATTER
      ↓
USER OUTPUT (Domain-Specific)
```

---

## 🎯 Benefits

### 1. **Separation of Concerns**
- Graph algorithms don't know about domains
- Domains don't know about algorithms
- Clear interfaces

### 2. **Reusability**
- Write algorithm once, works for ALL domains
- New domains just provide mapping
- No code duplication

### 3. **Extensibility**
- Add new domains: just create mapper
- Add new algorithms: works on all domains automatically
- Add new analysis types: universal

### 4. **Scalability**
- Algorithms optimized once
- Performance improvements benefit all domains
- Easier to maintain

### 5. **Testability**
- Test algorithms with synthetic graphs
- Test mappers independently
- Clear test boundaries

---

## 📊 Example: Risk Analysis Across Domains

**SAME ALGORITHM, DIFFERENT DOMAINS:**

```python
# Universal algorithm
def compute_risk_priority(graph: UniversalGraph):
    """Works for automotive, financial, process plant..."""
    
    for failure in graph.failure_modes.values():
        # Risk = Severity × Probability × (1 - Detectability)
        risk = (
            failure.severity * 
            failure.probability * 
            (1 - failure.detectability / 10)
        )
        
        failure.risk_priority = risk
    
    return sorted_failures_by_risk()

# USE IN AUTOMOTIVE
auto_graph = automotive_mapper.build_graph(auto_data)
auto_risks = compute_risk_priority(auto_graph)
# Returns: Brake failure RPN=180, Steering failure RPN=200...

# USE IN FINANCIAL
fin_graph = financial_mapper.build_graph(fin_data)
fin_risks = compute_risk_priority(fin_graph)
# Returns: Fraud risk=0.85, Money laundering risk=0.72...

# USE IN PROCESS PLANT
plant_graph = plant_mapper.build_graph(plant_data)
plant_risks = compute_risk_priority(plant_graph)
# Returns: Overpressure risk=0.90, Leak risk=0.65...
```

**Same algorithm, different interpretations!**

---

## 🏗️ Implementation Roadmap

### Phase 1: Core Universal Graph
- [ ] Implement FormElement, Function, FailureMode classes
- [ ] Implement UniversalGraph
- [ ] Time-series data structure
- [ ] Basic graph operations

### Phase 2: Domain Mappers
- [ ] Create mapper interface
- [ ] Implement automotive mapper
- [ ] Implement financial mapper
- [ ] Implement process plant mapper

### Phase 3: Universal Algorithms
- [ ] Structural analysis (form-centric)
- [ ] Functional analysis (function-centric)
- [ ] Risk analysis (failure-centric)
- [ ] Time-series analysis (property-centric)

### Phase 4: Integration
- [ ] Update domain adapters to use mappers
- [ ] Migrate existing algorithms
- [ ] API layer updates
- [ ] Frontend updates

---

## 📝 Summary

**Old Architecture:**
```
Domain → Custom Graph → Domain-Specific Algorithms → Results
```

**New Architecture:**
```
Domain → Mapper → Universal Graph → Universal Algorithms → Formatter → Results
```

**Key Innovation:**
- **Form-Function-Failure** paradigm
- **Time-series** properties vs **constant** characteristics
- **Function tree** = function call graph
- **Failure tree** = exception handling paths
- **Branch characteristics** = edge properties

**Result:**
- Write algorithms ONCE
- Work for ALL domains
- Clean separation
- Easier to extend
- Better performance

---

This is **Systems Engineering** applied to software architecture! 🎯
