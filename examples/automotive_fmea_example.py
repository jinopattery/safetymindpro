"""
Example: Using the Automotive Domain

This script demonstrates how to use the automotive domain adapter
to create an FMEA analysis for a vehicle braking system.
"""

from backend.domains import get_domain
from backend.core.graph import Graph, NodeData, EdgeData
import json


def create_braking_system_fmea():
    """
    Create an FMEA analysis for a vehicle braking system.
    
    Demonstrates:
    - Creating automotive components
    - Defining failure modes with FMEA ratings
    - Establishing function flows and failure propagation
    - Running FMEA risk analysis
    - Identifying critical components
    """
    
    # Get automotive domain adapter
    automotive = get_domain("automotive")
    if not automotive:
        print("ERROR: Automotive domain not registered!")
        return
    
    print("=" * 60)
    print("Automotive FMEA Example: Vehicle Braking System")
    print("=" * 60)
    print()
    
    # Create directed graph
    graph = Graph(directed=True)
    
    # 1. Create System Components
    print("1. Creating system components...")
    
    components = [
        {
            "id": "brake_pedal",
            "label": "Brake Pedal",
            "functions": ["Driver input", "Actuate master cylinder"]
        },
        {
            "id": "master_cylinder",
            "label": "Master Cylinder",
            "functions": ["Generate hydraulic pressure", "Distribute brake fluid"]
        },
        {
            "id": "brake_lines",
            "label": "Brake Lines",
            "functions": ["Transport brake fluid", "Maintain pressure"]
        },
        {
            "id": "brake_caliper",
            "label": "Brake Caliper",
            "functions": ["Apply clamping force", "Convert hydraulic to mechanical force"]
        },
        {
            "id": "brake_pads",
            "label": "Brake Pads",
            "functions": ["Create friction", "Stop wheel rotation"]
        }
    ]
    
    component_nodes = {}
    for comp in components:
        node = NodeData(
            type="component",
            label=comp["label"],
            domain="automotive",
            attributes={
                "functions": comp["functions"],
                "parent_component": None
            }
        )
        node_id = graph.add_node(node)
        component_nodes[comp["id"]] = node_id
        print(f"   ✓ Created component: {comp['label']}")
    
    # 2. Define Function Flows
    print("\n2. Defining function flows...")
    
    function_flows = [
        ("brake_pedal", "master_cylinder", "Actuate master cylinder"),
        ("master_cylinder", "brake_lines", "Hydraulic pressure transmission"),
        ("brake_lines", "brake_caliper", "Pressure delivery"),
        ("brake_caliper", "brake_pads", "Clamping force application")
    ]
    
    for source_key, target_key, description in function_flows:
        edge = EdgeData(
            source=component_nodes[source_key],
            target=component_nodes[target_key],
            type="function_flow",
            attributes={
                "function_description": description
            }
        )
        graph.add_edge(edge)
        print(f"   ✓ {components[[c['id'] for c in components].index(source_key)]['label']} → "
              f"{components[[c['id'] for c in components].index(target_key)]['label']}")
    
    # 3. Define Failure Modes with FMEA Ratings
    print("\n3. Defining failure modes with FMEA ratings...")
    
    failure_modes = [
        {
            "component": "master_cylinder",
            "label": "Internal Seal Failure",
            "severity": 9,
            "occurrence": 3,
            "detection": 5,
            "effects": ["Loss of hydraulic pressure", "Increased pedal travel", "Reduced braking"],
            "causes": ["Worn seals", "Contaminated fluid", "Excessive heat"],
            "controls": ["Regular fluid inspection", "Seal quality checks"]
        },
        {
            "component": "brake_lines",
            "label": "Brake Line Rupture",
            "severity": 10,
            "occurrence": 2,
            "detection": 3,
            "effects": ["Complete loss of braking", "Fluid leak", "Safety hazard"],
            "causes": ["Corrosion", "Impact damage", "Age deterioration"],
            "controls": ["Visual inspection", "Pressure testing"]
        },
        {
            "component": "brake_pads",
            "label": "Excessive Pad Wear",
            "severity": 7,
            "occurrence": 5,
            "detection": 4,
            "effects": ["Reduced braking efficiency", "Increased stopping distance"],
            "causes": ["Normal wear", "Aggressive driving", "Poor quality pads"],
            "controls": ["Thickness monitoring", "Regular replacement"]
        },
        {
            "component": "brake_caliper",
            "label": "Caliper Piston Seizure",
            "severity": 8,
            "occurrence": 3,
            "detection": 6,
            "effects": ["Uneven braking", "Brake drag", "Overheating"],
            "causes": ["Corrosion", "Lack of lubrication", "Contamination"],
            "controls": ["Periodic lubrication", "Inspection during service"]
        }
    ]
    
    failure_nodes = {}
    for fm in failure_modes:
        node = NodeData(
            type="failure_mode",
            label=fm["label"],
            domain="automotive",
            attributes={
                "component": fm["component"],
                "severity": fm["severity"],
                "occurrence": fm["occurrence"],
                "detection": fm["detection"],
                "effects": fm["effects"],
                "causes": fm["causes"],
                "controls": fm["controls"]
            }
        )
        
        # Enrich node (calculates RPN automatically)
        enriched_node = automotive.enrich_node(node)
        node_id = graph.add_node(enriched_node)
        failure_nodes[fm["label"]] = node_id
        
        rpn = enriched_node.attributes['rpn']
        risk_level = enriched_node.attributes['risk_level']
        
        print(f"   ✓ {fm['label']}: RPN={rpn} (S:{fm['severity']} × O:{fm['occurrence']} × D:{fm['detection']}) "
              f"[{risk_level.upper()}]")
    
    # 4. Define Failure Propagation
    print("\n4. Defining failure propagation paths...")
    
    propagations = [
        ("Internal Seal Failure", "brake_lines", 0.7, "Reduced pressure affects downstream"),
        ("Brake Line Rupture", "brake_caliper", 0.95, "Loss of hydraulic pressure"),
        ("Excessive Pad Wear", "brake_caliper", 0.4, "Increased heat generation")
    ]
    
    for failure_label, target_comp, probability, mechanism in propagations:
        edge = EdgeData(
            source=failure_nodes[failure_label],
            target=component_nodes[target_comp],
            type="failure_propagation",
            attributes={
                "propagation_probability": probability,
                "propagation_mechanism": mechanism
            }
        )
        graph.add_edge(edge)
        print(f"   ✓ {failure_label} → {components[[c['id'] for c in components].index(target_comp)]['label']} "
              f"(p={probability})")
    
    # 5. Run FMEA Risk Analysis
    print("\n5. Running FMEA Risk Analysis...")
    print("-" * 60)
    
    algorithms = automotive.get_algorithms()
    fmea_algo = [a for a in algorithms if a.name == "fmea_risk_analysis"][0]
    
    results = fmea_algo.run(graph, {"rpn_threshold": 100})
    
    print(f"\nTotal failure modes analyzed: {results['total_analyzed']}")
    print(f"RPN threshold: {results['threshold']}")
    print(f"\nHigh-risk failures (RPN ≥ {results['threshold']}):")
    
    for failure in results['high_risk_failures']:
        print(f"  • {failure['failure_mode']} (Component: {failure['component']})")
        print(f"    RPN: {failure['rpn']}")
    
    # 6. Identify Critical Components
    print("\n6. Identifying Critical Components...")
    print("-" * 60)
    
    critical_algo = [a for a in algorithms if a.name == "critical_components"][0]
    critical_results = critical_algo.run(graph, {"top_n": 3})
    
    print(f"\nTop {len(critical_results['critical_components'])} critical components:")
    for comp in critical_results['critical_components']:
        print(f"  • {comp['component']}")
        print(f"    Centrality Score: {comp['centrality_score']:.3f}")
        print(f"    Type: {comp['type']}")
    
    # 7. Analyze Failure Propagation
    print("\n7. Analyzing Failure Propagation...")
    print("-" * 60)
    
    propagation_algo = [a for a in algorithms if a.name == "failure_propagation"][0]
    prop_results = propagation_algo.run(graph, {"max_depth": 3})
    
    print(f"\nFailure propagation paths found: {len(prop_results['propagation_paths'])}")
    
    if prop_results['most_critical']:
        most_critical = prop_results['most_critical']
        print(f"\nMost critical failure source:")
        print(f"  Source: {most_critical['source']}")
        print(f"  Affected nodes: {most_critical['affected_nodes']}")
    
    # 8. Export Results
    print("\n8. Exporting Results...")
    print("-" * 60)
    
    export_data = {
        "graph": graph.to_dict(),
        "analysis_results": {
            "fmea_risk": results,
            "critical_components": critical_results,
            "propagation": prop_results
        },
        "summary": {
            "total_components": len(components),
            "total_failure_modes": len(failure_modes),
            "high_risk_count": len(results['high_risk_failures']),
            "average_centrality": critical_results['average_centrality']
        }
    }
    
    output_file = "braking_system_fmea_results.json"
    with open(f"/home/claude/{output_file}", 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"\n✓ Results exported to: {output_file}")
    
    # 9. Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Components analyzed: {len(components)}")
    print(f"Failure modes identified: {len(failure_modes)}")
    print(f"High-risk failures: {len(results['high_risk_failures'])}")
    print(f"Function flows defined: {len(function_flows)}")
    print(f"Propagation paths: {len(propagations)}")
    print("\n✓ FMEA Analysis Complete!")
    print("=" * 60)
    
    return graph, export_data


if __name__ == "__main__":
    # Run the example
    graph, results = create_braking_system_fmea()
    
    print("\n\nTo integrate this with the API:")
    print("1. Start the FastAPI server")
    print("2. POST graph data to /api/v1/domains/run-algorithm")
    print("3. Use /api/v1/domains/automotive/styling for visualization")
