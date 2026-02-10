#!/usr/bin/env python3
"""
Domain Template Generator

CLI tool to scaffold a new domain quickly.
Generates models, adapter, YAML config, and example script.
"""

import os
import sys
from pathlib import Path
import argparse


MODELS_TEMPLATE = '''"""
{domain_display_name} Domain Models

Data models for {domain_description}.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class {entity_name}(BaseModel):
    """Main entity in {domain_name} domain"""
    id: str
    name: str
    type: str
    
    # Add your fields here
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Attributes
    attributes: Dict[str, Any] = Field(default_factory=dict)


class {relationship_name}(BaseModel):
    """Relationship between {entity_name_lower} entities"""
    id: str
    from_{entity_name_lower}: str
    to_{entity_name_lower}: str
    relationship_type: str
    
    # Add relationship attributes
    strength: float = 1.0
    bidirectional: bool = False


class {domain_class_name}Network(BaseModel):
    """Complete {domain_name} network analysis"""
    id: str
    name: str
    description: str
    
    entities: List[{entity_name}]
    relationships: List[{relationship_name}]
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def get_entity_by_id(self, entity_id: str) -> Optional[{entity_name}]:
        """Get entity by ID"""
        for e in self.entities:
            if e.id == entity_id:
                return e
        return None
'''

ADAPTER_TEMPLATE = '''"""
{domain_display_name} Domain Adapter

Implements the DomainAdapter interface for {domain_description}.
"""

from typing import Dict, List, Any, Optional
from backend.domains.base import (
    DomainAdapter, DomainNodeType, DomainEdgeType,
    DomainAlgorithm, StylingConfig
)
from backend.core.graph import NodeData, EdgeData, Graph
import networkx as nx


class {domain_class_name}Analysis(DomainAlgorithm):
    """Main analysis algorithm for {domain_name}"""
    
    @property
    def name(self) -> str:
        return "{domain_name}_analysis"
    
    @property
    def description(self) -> str:
        return "Main analysis algorithm for {domain_description}"
    
    def run(self, graph: Graph, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run {domain_name} analysis"""
        # Implement your algorithm logic here
        results = {{
            'total_nodes': graph.graph.number_of_nodes(),
            'total_edges': graph.graph.number_of_edges()
        }}
        
        return results


class {domain_class_name}Domain(DomainAdapter):
    """
    {domain_display_name} domain adapter.
    
    {domain_description}
    """
    
    @property
    def domain_name(self) -> str:
        return "{domain_name}"
    
    @property
    def domain_display_name(self) -> str:
        return "{domain_display_name}"
    
    @property
    def description(self) -> str:
        return "{domain_description}"
    
    def get_node_types(self) -> List[DomainNodeType]:
        return [
            DomainNodeType(
                name="{node_type_1}",
                display_name="{node_type_1_display}",
                icon="{icon_1}",
                description="Main node type in {domain_name}",
                default_attributes={{}}
            ),
            DomainNodeType(
                name="{node_type_2}",
                display_name="{node_type_2_display}",
                icon="{icon_2}",
                description="Secondary node type in {domain_name}",
                default_attributes={{}}
            )
        ]
    
    def get_edge_types(self) -> List[DomainEdgeType]:
        return [
            DomainEdgeType(
                name="{edge_type_1}",
                display_name="{edge_type_1_display}",
                description="Main edge type in {domain_name}",
                directed=True,
                default_attributes={{}}
            )
        ]
    
    def get_styling_config(self) -> StylingConfig:
        return StylingConfig(
            node_styles={{
                "{node_type_1}": {{
                    "backgroundColor": "#3498db",
                    "color": "#ffffff",
                    "borderWidth": 2,
                    "fontSize": 13
                }},
                "{node_type_2}": {{
                    "backgroundColor": "#2ecc71",
                    "color": "#ffffff",
                    "borderWidth": 2,
                    "fontSize": 13
                }}
            }},
            edge_styles={{
                "{edge_type_1}": {{
                    "stroke": "#95a5a6",
                    "strokeWidth": 2,
                    "type": "smoothstep"
                }}
            }},
            theme={{
                "name": "{domain_display_name}",
                "primaryColor": "#3498db"
            }}
        )
    
    def get_algorithms(self) -> List[DomainAlgorithm]:
        return [
            {domain_class_name}Analysis()
        ]
    
    def validate_node(self, node_data: Dict[str, Any]) -> bool:
        """Validate {domain_name} node"""
        node_type = node_data.get('type')
        valid_types = [nt.name for nt in self.get_node_types()]
        return node_type in valid_types
    
    def validate_edge(self, edge_data: Dict[str, Any]) -> bool:
        """Validate {domain_name} edge"""
        edge_type = edge_data.get('type')
        valid_types = [et.name for et in self.get_edge_types()]
        return edge_type in valid_types
'''

YAML_TEMPLATE = '''# {domain_display_name} Domain Styling Configuration

domain: {domain_name}
display_name: "{domain_display_name}"

node_styles:
  {node_type_1}:
    shape: rectangle
    backgroundColor: "#3498db"
    color: "#ffffff"
    borderColor: "#2980b9"
    borderWidth: 2
    fontSize: 13
    padding: 12
    icon: "{icon_1}"
    
  {node_type_2}:
    shape: circle
    backgroundColor: "#2ecc71"
    color: "#ffffff"
    borderColor: "#27ae60"
    borderWidth: 2
    fontSize: 13
    padding: 10
    icon: "{icon_2}"

edge_styles:
  {edge_type_1}:
    stroke: "#95a5a6"
    strokeWidth: 2
    type: smoothstep
    arrowSize: 8

theme:
  name: "{domain_display_name}"
  primaryColor: "#3498db"
  dangerColor: "#e74c3c"
  successColor: "#2ecc71"
  backgroundColor: "#ecf0f1"
'''

EXAMPLE_TEMPLATE = '''"""
Example: Using the {domain_display_name} Domain

{domain_description}
"""

from backend.domains import get_domain
from backend.core.graph import Graph, NodeData, EdgeData


def create_{domain_name}_example():
    """
    Create a {domain_name} example.
    """
    
    # Get domain adapter
    domain = get_domain("{domain_name}")
    if not domain:
        print("ERROR: {domain_display_name} domain not registered!")
        return
    
    print("=" * 70)
    print("{domain_display_name} Example")
    print("=" * 70)
    
    # Create graph
    graph = Graph(directed=True)
    
    # Create nodes
    node1 = NodeData(
        type="{node_type_1}",
        label="Example Node 1",
        domain="{domain_name}",
        attributes={{}}
    )
    graph.add_node(node1)
    
    node2 = NodeData(
        type="{node_type_2}",
        label="Example Node 2",
        domain="{domain_name}",
        attributes={{}}
    )
    graph.add_node(node2)
    
    # Create edge
    edge = EdgeData(
        source=node1.id,
        target=node2.id,
        type="{edge_type_1}",
        attributes={{}}
    )
    graph.add_edge(edge)
    
    # Run analysis
    algorithms = domain.get_algorithms()
    if algorithms:
        algo = algorithms[0]
        results = algo.run(graph)
        print("\\nAnalysis Results:")
        print(results)
    
    print("\\n✓ Example Complete!")
    return graph


if __name__ == "__main__":
    create_{domain_name}_example()
'''


def create_domain(args):
    """Create a new domain from template"""
    
    domain_name = args.name.lower().replace(" ", "_")
    domain_display_name = args.display_name or args.name.title()
    domain_description = args.description or f"{domain_display_name} analysis"
    
    # Derive class names
    domain_class_name = ''.join(word.capitalize() for word in domain_name.split('_'))
    entity_name = args.entity or f"{domain_class_name}Entity"
    relationship_name = f"{entity_name}Relationship"
    entity_name_lower = entity_name[0].lower() + entity_name[1:]
    
    # Node and edge types
    node_type_1 = args.node_types[0] if len(args.node_types) > 0 else f"{domain_name}_node"
    node_type_2 = args.node_types[1] if len(args.node_types) > 1 else f"{domain_name}_secondary"
    node_type_1_display = node_type_1.replace("_", " ").title()
    node_type_2_display = node_type_2.replace("_", " ").title()
    
    edge_type_1 = args.edge_types[0] if len(args.edge_types) > 0 else f"{domain_name}_connection"
    edge_type_1_display = edge_type_1.replace("_", " ").title()
    
    # Icons
    icon_1 = args.icons[0] if len(args.icons) > 0 else "🔵"
    icon_2 = args.icons[1] if len(args.icons) > 1 else "🟢"
    
    # Base directory
    base_dir = Path(args.output_dir) / "backend" / "domains" / domain_name
    base_dir.mkdir(parents=True, exist_ok=True)
    
    # Template variables
    template_vars = {
        'domain_name': domain_name,
        'domain_display_name': domain_display_name,
        'domain_description': domain_description,
        'domain_class_name': domain_class_name,
        'entity_name': entity_name,
        'relationship_name': relationship_name,
        'entity_name_lower': entity_name_lower,
        'node_type_1': node_type_1,
        'node_type_2': node_type_2,
        'node_type_1_display': node_type_1_display,
        'node_type_2_display': node_type_2_display,
        'edge_type_1': edge_type_1,
        'edge_type_1_display': edge_type_1_display,
        'icon_1': icon_1,
        'icon_2': icon_2
    }
    
    # Create models.py
    models_file = base_dir / "models.py"
    with open(models_file, 'w') as f:
        f.write(MODELS_TEMPLATE.format(**template_vars))
    print(f"✓ Created {models_file}")
    
    # Create adapter.py
    adapter_file = base_dir / "adapter.py"
    with open(adapter_file, 'w') as f:
        f.write(ADAPTER_TEMPLATE.format(**template_vars))
    print(f"✓ Created {adapter_file}")
    
    # Create __init__.py
    init_file = base_dir / "__init__.py"
    with open(init_file, 'w') as f:
        f.write(f'"""{domain_display_name} Domain Package"""\n\n')
        f.write(f'from backend.domains.{domain_name}.adapter import {domain_class_name}Domain\n\n')
        f.write(f'__all__ = ["{domain_class_name}Domain"]\n')
    print(f"✓ Created {init_file}")
    
    # Create YAML config
    config_dir = Path(args.output_dir) / "backend" / "config" / "domains"
    config_dir.mkdir(parents=True, exist_ok=True)
    yaml_file = config_dir / f"{domain_name}.yaml"
    with open(yaml_file, 'w') as f:
        f.write(YAML_TEMPLATE.format(**template_vars))
    print(f"✓ Created {yaml_file}")
    
    # Create example script
    examples_dir = Path(args.output_dir) / "examples"
    examples_dir.mkdir(parents=True, exist_ok=True)
    example_file = examples_dir / f"{domain_name}_example.py"
    with open(example_file, 'w') as f:
        f.write(EXAMPLE_TEMPLATE.format(**template_vars))
    print(f"✓ Created {example_file}")
    
    # Print next steps
    print("\n" + "="*70)
    print("✓ Domain Template Created Successfully!")
    print("="*70)
    print("\nNext Steps:")
    print(f"1. Edit {base_dir}/models.py to add your domain models")
    print(f"2. Edit {base_dir}/adapter.py to implement algorithms")
    print(f"3. Customize {yaml_file} for styling")
    print(f"4. Register domain in backend/domains/__init__.py:")
    print(f"   from backend.domains.{domain_name}.adapter import {domain_class_name}Domain")
    print(f"   register_domain({domain_class_name}Domain())")
    print(f"5. Test with: python {example_file}")
    print("="*70)


def main():
    parser = argparse.ArgumentParser(
        description="Generate a new SafetyMindPro domain template",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a basic supply chain domain
  python domain_generator.py --name supply_chain \\
    --display-name "Supply Chain" \\
    --description "Supply chain risk analysis"
  
  # Create with custom node and edge types
  python domain_generator.py --name healthcare \\
    --display-name "Healthcare" \\
    --node-types patient facility \\
    --edge-types transfer treatment \\
    --icons "🏥" "👤"
        """
    )
    
    parser.add_argument('--name', required=True,
                        help='Domain name (e.g., supply_chain, healthcare)')
    parser.add_argument('--display-name',
                        help='Display name (e.g., "Supply Chain")')
    parser.add_argument('--description',
                        help='Domain description')
    parser.add_argument('--entity',
                        help='Main entity class name (default: auto-generated)')
    parser.add_argument('--node-types', nargs='+', default=[],
                        help='Node type names (default: auto-generated)')
    parser.add_argument('--edge-types', nargs='+', default=[],
                        help='Edge type names (default: auto-generated)')
    parser.add_argument('--icons', nargs='+', default=[],
                        help='Node icons (emoji)')
    parser.add_argument('--output-dir', default='.',
                        help='Output directory (default: current directory)')
    
    args = parser.parse_args()
    
    create_domain(args)


if __name__ == '__main__':
    main()
