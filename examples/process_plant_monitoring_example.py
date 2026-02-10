"""
Example: Using the Process Plant Domain

This script demonstrates how to use the process plant domain adapter
to monitor a chemical processing unit and detect anomalies.
"""

from backend.domains import get_domain
from backend.core.graph import Graph, NodeData, EdgeData
import json
import random


def create_chemical_process_monitoring():
    """
    Create a process plant monitoring system for a chemical reactor unit.
    
    Demonstrates:
    - Creating process equipment nodes
    - Defining mass and temperature flows
    - Setting up sensors
    - Detecting anomalies
    - Analyzing flow balance
    - Assessing propagation risk
    """
    
    # Get process plant domain adapter
    process_plant = get_domain("process_plant")
    if not process_plant:
        print("ERROR: Process Plant domain not registered!")
        return
    
    print("=" * 70)
    print("Process Plant Example: Chemical Reactor Monitoring System")
    print("=" * 70)
    print()
    
    # Create directed graph
    graph = Graph(directed=True)
    
    # 1. Create Process Equipment
    print("1. Creating process equipment...")
    
    equipment_list = [
        {
            "id": "feed_tank",
            "label": "Feed Tank T-101",
            "type": "tank",
            "temp": 25,
            "pressure": 1.5,
            "capacity": 10000,
            "max_temp": 80,
            "max_pressure": 5
        },
        {
            "id": "feed_pump",
            "label": "Feed Pump P-101",
            "type": "pump",
            "temp": 30,
            "pressure": 15,
            "flow_rate": 2000,
            "max_temp": 100,
            "max_pressure": 25
        },
        {
            "id": "heat_exchanger",
            "label": "Heat Exchanger HX-101",
            "type": "heat_exchanger",
            "temp": 180,
            "pressure": 12,
            "max_temp": 250,
            "max_pressure": 20
        },
        {
            "id": "reactor",
            "label": "Reactor R-101",
            "type": "reactor",
            "temp": 220,
            "pressure": 10,
            "capacity": 5000,
            "max_temp": 280,
            "max_pressure": 15
        },
        {
            "id": "cooler",
            "label": "Product Cooler HX-102",
            "type": "heat_exchanger",
            "temp": 85,
            "pressure": 8,
            "max_temp": 150,
            "max_pressure": 12
        },
        {
            "id": "product_tank",
            "label": "Product Tank T-102",
            "type": "tank",
            "temp": 40,
            "pressure": 2,
            "capacity": 8000,
            "max_temp": 80,
            "max_pressure": 5
        }
    ]
    
    equipment_nodes = {}
    for equip in equipment_list:
        node = NodeData(
            type="equipment",
            label=equip["label"],
            domain="process_plant",
            attributes={
                "equipment_type": equip["type"],
                "temperature": equip["temp"],
                "pressure": equip["pressure"],
                "capacity": equip.get("capacity"),
                "flow_rate": equip.get("flow_rate"),
                "design_temperature_max": equip["max_temp"],
                "design_pressure_max": equip["max_pressure"],
                "area": "Reactor Unit",
                "operational_status": "normal"
            }
        )
        
        # Enrich node (calculates utilization)
        enriched_node = process_plant.enrich_node(node)
        node_id = graph.add_node(enriched_node)
        equipment_nodes[equip["id"]] = node_id
        
        temp_util = enriched_node.attributes.get('temperature_utilization', 0)
        press_util = enriched_node.attributes.get('pressure_utilization', 0)
        status = enriched_node.attributes.get('operational_status', 'normal')
        
        print(f"   ✓ {equip['label']}: {equip['temp']}°C ({temp_util:.1f}% of max), "
              f"{equip['pressure']} bar ({press_util:.1f}% of max) [{status.upper()}]")
    
    # 2. Create Sensors
    print("\n2. Creating sensors...")
    
    sensors = [
        {
            "label": "Feed Tank Temperature",
            "equipment": "feed_tank",
            "type": "temperature",
            "value": 25,
            "unit": "°C",
            "min": 15,
            "max": 35
        },
        {
            "label": "Reactor Temperature",
            "equipment": "reactor",
            "type": "temperature",
            "value": 220,
            "unit": "°C",
            "min": 200,
            "max": 250
        },
        {
            "label": "Reactor Pressure",
            "equipment": "reactor",
            "type": "pressure",
            "value": 10,
            "unit": "bar",
            "min": 8,
            "max": 12
        },
        {
            "label": "Feed Flow Rate",
            "equipment": "feed_pump",
            "type": "flow",
            "value": 2000,
            "unit": "kg/hr",
            "min": 1800,
            "max": 2200
        }
    ]
    
    sensor_nodes = {}
    for sensor in sensors:
        node = NodeData(
            type="sensor",
            label=sensor["label"],
            domain="process_plant",
            attributes={
                "equipment_id": equipment_nodes[sensor["equipment"]],
                "sensor_type": sensor["type"],
                "current_value": sensor["value"],
                "unit": sensor["unit"],
                "min_normal": sensor["min"],
                "max_normal": sensor["max"],
                "status": "normal"
            }
        )
        node_id = graph.add_node(node)
        sensor_nodes[sensor["label"]] = node_id
        print(f"   ✓ {sensor['label']}: {sensor['value']} {sensor['unit']} "
              f"(range: {sensor['min']}-{sensor['max']})")
    
    # 3. Define Mass Flows
    print("\n3. Defining mass flows...")
    
    flows = [
        ("feed_tank", "feed_pump", 2000, "Reactant A", 25),
        ("feed_pump", "heat_exchanger", 2000, "Reactant A", 30),
        ("heat_exchanger", "reactor", 2000, "Reactant A", 180),
        ("reactor", "cooler", 1950, "Product", 220),
        ("cooler", "product_tank", 1950, "Product", 85)
    ]
    
    for source_key, target_key, flow_rate, substance, temp in flows:
        edge = EdgeData(
            source=equipment_nodes[source_key],
            target=equipment_nodes[target_key],
            type="mass_flow",
            attributes={
                "flow_rate": flow_rate,
                "substance": substance,
                "temperature": temp,
                "pressure": equipment_list[[e['id'] for e in equipment_list].index(source_key)]['pressure']
            }
        )
        graph.add_edge(edge)
        
        source_label = equipment_list[[e['id'] for e in equipment_list].index(source_key)]['label']
        target_label = equipment_list[[e['id'] for e in equipment_list].index(target_key)]['label']
        print(f"   ✓ {source_label} → {target_label}: {flow_rate} kg/hr @ {temp}°C")
    
    # 4. Simulate Anomaly Conditions
    print("\n4. Simulating anomaly conditions...")
    
    # Introduce an anomaly: Reactor overheating
    reactor_node_id = equipment_nodes["reactor"]
    reactor_data = graph.get_node(reactor_node_id)
    reactor_data['attributes']['temperature'] = 295  # Above max (280°C)
    
    # Update the graph
    graph.graph.nodes[reactor_node_id]['attributes']['temperature'] = 295
    
    print(f"   ⚠ ANOMALY INTRODUCED: Reactor temperature increased to 295°C (max: 280°C)")
    
    # Update sensor reading
    reactor_temp_sensor_data = graph.get_node(sensor_nodes["Reactor Temperature"])
    graph.graph.nodes[sensor_nodes["Reactor Temperature"]]['attributes']['current_value'] = 295
    
    print(f"   ⚠ Reactor Temperature sensor now reading: 295°C")
    
    # 5. Run Flow Balance Analysis
    print("\n5. Running Flow Balance Analysis...")
    print("-" * 70)
    
    algorithms = process_plant.get_algorithms()
    flow_algo = [a for a in algorithms if a.name == "flow_balance_analysis"][0]
    
    flow_results = flow_algo.run(graph, {"tolerance": 0.05})
    
    print(f"\nEquipment checked: {flow_results['equipment_checked']}")
    print(f"Balance tolerance: {flow_results['tolerance_percent']}%")
    
    if flow_results['imbalances']:
        print(f"\n⚠ Flow Imbalances Detected:")
        for imbalance in flow_results['imbalances']:
            print(f"  • {imbalance['equipment_name']}")
            print(f"    Incoming: {imbalance['incoming']} kg/hr")
            print(f"    Outgoing: {imbalance['outgoing']} kg/hr")
            print(f"    Imbalance: {imbalance['imbalance_percent']}%")
    else:
        print("\n✓ All equipment flows balanced within tolerance")
    
    # 6. Run Anomaly Detection
    print("\n6. Running Anomaly Detection...")
    print("-" * 70)
    
    anomaly_algo = [a for a in algorithms if a.name == "anomaly_detection"][0]
    anomaly_results = anomaly_algo.run(graph)
    
    print(f"\nTotal anomalies detected: {anomaly_results['total_anomalies']}")
    print(f"Critical anomalies (severity ≥ 7): {anomaly_results['critical_anomalies']}")
    
    if anomaly_results['anomalies']:
        print(f"\n⚠ Anomalies Found:")
        for anomaly in anomaly_results['anomalies']:
            if 'equipment_name' in anomaly:
                print(f"  • Equipment: {anomaly['equipment_name']}")
                print(f"    Type: {', '.join(anomaly['anomaly_types'])}")
                print(f"    Severity: {anomaly['severity']}/10")
                if 'temperature' in anomaly:
                    print(f"    Temperature: {anomaly['temperature']}°C")
                if 'pressure' in anomaly:
                    print(f"    Pressure: {anomaly['pressure']} bar")
            elif 'sensor_name' in anomaly:
                print(f"  • Sensor: {anomaly['sensor_name']}")
                print(f"    Reading: {anomaly['current_value']}")
                print(f"    Expected: {anomaly['expected_range']}")
                print(f"    Deviation: {anomaly['deviation_percent']}%")
    else:
        print("\n✓ No anomalies detected")
    
    # 7. Analyze Propagation Risk
    print("\n7. Analyzing Propagation Risk...")
    print("-" * 70)
    
    propagation_algo = [a for a in algorithms if a.name == "propagation_risk"][0]
    prop_results = propagation_algo.run(graph, {"max_depth": 4})
    
    print(f"\nRisk sources identified: {prop_results['total_risk_sources']}")
    
    if prop_results['propagation_risks']:
        print(f"\n⚠ Propagation Risks:")
        for risk in prop_results['propagation_risks']:
            print(f"  • Source: {risk['source_name']}")
            print(f"    Potentially affected equipment: {risk['affected_count']}")
            print(f"    Maximum propagation depth: {risk['max_depth']}")
            if risk['affected_count'] > 0:
                print(f"    Affected equipment:")
                for affected in risk['affected_equipment'][:3]:  # Show first 3
                    print(f"      - {affected['equipment_name']} (depth: {affected['propagation_depth']})")
    else:
        print("\n✓ No propagation risks identified")
    
    # 8. Export Results
    print("\n8. Exporting Results...")
    print("-" * 70)
    
    export_data = {
        "graph": graph.to_dict(),
        "analysis_results": {
            "flow_balance": flow_results,
            "anomaly_detection": anomaly_results,
            "propagation_risk": prop_results
        },
        "summary": {
            "total_equipment": len(equipment_list),
            "total_sensors": len(sensors),
            "total_flows": len(flows),
            "total_anomalies": anomaly_results['total_anomalies'],
            "critical_anomalies": anomaly_results['critical_anomalies'],
            "flow_imbalances": len(flow_results['imbalances'])
        }
    }
    
    output_file = "process_plant_monitoring_results.json"
    with open(f"/home/claude/{output_file}", 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"\n✓ Results exported to: {output_file}")
    
    # 9. Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Equipment monitored: {len(equipment_list)}")
    print(f"Sensors installed: {len(sensors)}")
    print(f"Mass flows tracked: {len(flows)}")
    print(f"Anomalies detected: {anomaly_results['total_anomalies']}")
    print(f"Critical anomalies: {anomaly_results['critical_anomalies']}")
    print(f"Flow imbalances: {len(flow_results['imbalances'])}")
    print(f"Equipment at risk: {sum(r['affected_count'] for r in prop_results['propagation_risks'])}")
    
    if anomaly_results['critical_anomalies'] > 0:
        print("\n⚠ ALERT: Critical anomalies require immediate attention!")
    else:
        print("\n✓ System operating within normal parameters")
    
    print("=" * 70)
    
    return graph, export_data


if __name__ == "__main__":
    # Run the example
    graph, results = create_chemical_process_monitoring()
    
    print("\n\nTo integrate this with the API:")
    print("1. Start the FastAPI server")
    print("2. POST graph data to /api/v1/domains/run-algorithm")
    print("3. Use /api/v1/domains/process_plant/styling for visualization")
    print("\nMonitoring Features:")
    print("  • Real-time flow balance checking")
    print("  • Anomaly detection based on sensor thresholds")
    print("  • Propagation risk analysis")
    print("  • Equipment utilization tracking")
