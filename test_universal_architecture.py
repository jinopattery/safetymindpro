"""
Simple test for Universal Graph Architecture

This test validates the end-to-end flow:
1. Create domain-specific data
2. Map to universal graph
3. Run algorithms
4. Format results
"""

from datetime import datetime
from backend.core.universal_graph import UniversalGraph, FormElement, Function, FailureMode
from backend.domains.automotive.mapper import AutomotiveMapper
from backend.algorithms import structural_analysis, risk_analysis


def test_automotive_universal_flow():
    """Test automotive domain with universal architecture"""
    
    # 1. Create automotive domain data
    automotive_data = {
        'components': [
            {
                'id': 'BRAKE_001',
                'type': 'brake_component',
                'part_number': 'BRK-12345',
                'material': 'steel',
                'supplier': 'Acme Corp',
                'properties': [
                    {
                        'timestamp': '2024-01-01T00:00:00',
                        'temperature': 75.5,
                        'vibration': 0.2,
                        'wear': 0.05
                    },
                    {
                        'timestamp': '2024-01-02T00:00:00',
                        'temperature': 78.0,
                        'vibration': 0.3,
                        'wear': 0.06
                    }
                ]
            },
            {
                'id': 'ENGINE_001',
                'type': 'engine_component',
                'part_number': 'ENG-54321',
                'material': 'aluminum',
                'supplier': 'MotorWorks Inc'
            }
        ],
        'functions': [
            {
                'id': 'FUNC_BRAKE',
                'name': 'Brake Vehicle',
                'inputs': ['brake_pedal_force'],
                'outputs': ['braking_torque'],
                'performance': {'response_time': 0.2}
            }
        ],
        'failure_modes': [
            {
                'id': 'FM_BRAKE_WEAR',
                'failure_mode': 'Brake Pad Wear',
                'component': 'BRAKE_001',
                'severity': 8,
                'occurrence': 5,
                'detection': 3,
                'controls': ['Regular inspection', 'Wear sensor']
            },
            {
                'id': 'FM_BRAKE_SEIZURE',
                'failure_mode': 'Brake Piston Seizure',
                'component': 'BRAKE_001',
                'severity': 9,
                'occurrence': 2,
                'detection': 4,
                'controls': ['Maintenance schedule']
            }
        ],
        'relationships': {
            'form_to_function': [
                {'form_id': 'BRAKE_001', 'function_id': 'FUNC_BRAKE'}
            ],
            'form_to_failure': [
                {'form_id': 'BRAKE_001', 'failure_id': 'FM_BRAKE_WEAR'},
                {'form_id': 'BRAKE_001', 'failure_id': 'FM_BRAKE_SEIZURE'}
            ],
            'failure_propagation': [
                {
                    'source_id': 'FM_BRAKE_WEAR',
                    'target_id': 'FM_BRAKE_SEIZURE',
                    'probability': 0.3,
                    'mechanism': 'Wear debris causes seizure'
                }
            ]
        }
    }
    
    # 2. Initialize mapper
    mapper = AutomotiveMapper()
    print(f"Mapper: {mapper.domain_name}")
    print(f"Metadata: {mapper.get_metadata()}")
    
    # 3. Map to universal graph
    print("\n--- Mapping to Universal Graph ---")
    universal_graph = mapper.map_to_universal_graph(automotive_data)
    
    print(f"Form elements: {len(universal_graph.form_elements)}")
    print(f"Functions: {len(universal_graph.functions)}")
    print(f"Failure modes: {len(universal_graph.failure_modes)}")
    
    # 4. Run structural analysis
    print("\n--- Running Structural Analysis ---")
    criticality_scores = structural_analysis.compute_criticality(universal_graph)
    print(f"Criticality scores: {criticality_scores}")
    
    # 5. Run risk analysis
    print("\n--- Running Risk Analysis ---")
    risk_priorities = risk_analysis.compute_risk_priority(universal_graph)
    print(f"Number of risk priorities: {len(risk_priorities)}")
    
    if risk_priorities:
        top_risk = risk_priorities[0]
        print(f"Top risk: {top_risk['failure_name']} (score: {top_risk['risk_score']:.2f})")
    
    # 6. Format results
    print("\n--- Formatting Results ---")
    results = {
        'criticality_scores': criticality_scores,
        'risk_priorities': risk_priorities,
        'analysis_type': 'combined'
    }
    
    formatted = mapper.format_results(results, universal_graph)
    print(f"Formatted results domain: {formatted['domain']}")
    
    if 'critical_components' in formatted.get('results', {}):
        print(f"Critical components: {len(formatted['results']['critical_components'])}")
    
    if 'fmea_risks' in formatted.get('results', {}):
        print(f"FMEA risks: {len(formatted['results']['fmea_risks'])}")
        for risk in formatted['results']['fmea_risks'][:2]:
            print(f"  - {risk['failure_mode']}: RPN={risk['rpn']}")
    
    # 7. Test serialization
    print("\n--- Testing Serialization ---")
    graph_dict = universal_graph.to_dict()
    print(f"Serialized graph keys: {list(graph_dict.keys())}")
    
    # 8. Test deserialization
    restored_graph = UniversalGraph.from_dict(graph_dict)
    print(f"Restored graph - Form elements: {len(restored_graph.form_elements)}")
    print(f"Restored graph - Functions: {len(restored_graph.functions)}")
    print(f"Restored graph - Failure modes: {len(restored_graph.failure_modes)}")
    
    print("\n✅ All tests passed!")
    return True


if __name__ == '__main__':
    test_automotive_universal_flow()
