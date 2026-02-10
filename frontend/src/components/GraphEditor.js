import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphEditor.css';

function GraphEditor({ graph, domainInfo, domainStyling, onGraphChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges || []);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');

  // Update local state when graph prop changes
  React.useEffect(() => {
    if (graph.nodes) setNodes(graph.nodes);
    if (graph.edges) setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  // Notify parent of changes
  React.useEffect(() => {
    onGraphChange({ nodes, edges });
  }, [nodes, edges, onGraphChange]);

  // Apply domain styling to nodes
  const getNodeStyle = (nodeType) => {
    if (!domainStyling || !domainStyling.node_styles) return {};
    
    const style = domainStyling.node_styles[nodeType] || {};
    return {
      background: style.backgroundColor || '#3498db',
      color: style.color || '#ffffff',
      border: `${style.borderWidth || 2}px solid ${style.borderColor || '#2980b9'}`,
      borderRadius: `${style.borderRadius || 5}px`,
      padding: `${style.padding || 10}px`,
      fontSize: `${style.fontSize || 12}px`
    };
  };

  // Apply domain styling to edges
  const getEdgeStyle = (edgeType) => {
    if (!domainStyling || !domainStyling.edge_styles) return {};
    
    const style = domainStyling.edge_styles[edgeType] || {};
    return {
      stroke: style.stroke || '#999',
      strokeWidth: style.strokeWidth || 2,
      strokeDasharray: style.strokeDasharray || undefined
    };
  };

  const onConnect = useCallback(
    (params) => {
      const edgeType = selectedEdgeType || (domainInfo?.edge_types[0]?.name || 'default');
      const edgeStyle = getEdgeStyle(edgeType);
      
      setEdges((eds) =>
        addEdge({
          ...params,
          type: edgeType,
          animated: domainStyling?.edge_styles?.[edgeType]?.animated || false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: edgeStyle
        }, eds)
      );
    },
    [selectedEdgeType, domainInfo, domainStyling, setEdges]
  );

  const addNode = () => {
    if (!nodeLabel.trim() || !selectedNodeType) {
      alert('Please enter a node label and select a node type');
      return;
    }

    const nodeType = selectedNodeType;
    const nodeStyle = getNodeStyle(nodeType);
    const icon = domainInfo?.node_types.find(nt => nt.name === nodeType)?.icon || '';

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      data: { 
        label: `${icon} ${nodeLabel}`,
        nodeType: nodeType,
        attributes: {}
      },
      position: { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 300 + 50 
      },
      style: nodeStyle
    };

    setNodes((nds) => nds.concat(newNode));
    setNodeLabel('');
  };

  const onNodesDelete = useCallback(
    (deleted) => {
      setEdges((eds) =>
        eds.filter(
          (edge) => !deleted.some((node) => node.id === edge.source || node.id === edge.target)
        )
      );
    },
    [setEdges]
  );

  return (
    <div className="graph-editor">
      <div className="graph-toolbar">
        <div className="toolbar-section">
          <h4>Add Node</h4>
          <select 
            value={selectedNodeType || ''} 
            onChange={(e) => setSelectedNodeType(e.target.value)}
            className="node-type-select"
          >
            <option value="">Select Type...</option>
            {domainInfo?.node_types.map(nt => (
              <option key={nt.name} value={nt.name}>
                {nt.icon} {nt.display_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Node label"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addNode()}
          />
          <button onClick={addNode} className="btn btn-add">
            ➕ Add Node
          </button>
        </div>

        <div className="toolbar-section">
          <h4>Connection Type</h4>
          <select 
            value={selectedEdgeType || ''} 
            onChange={(e) => setSelectedEdgeType(e.target.value)}
            className="edge-type-select"
          >
            <option value="">Default</option>
            {domainInfo?.edge_types.map(et => (
              <option key={et.name} value={et.name}>
                {et.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const nodeType = node.data?.nodeType;
              return domainStyling?.node_styles?.[nodeType]?.backgroundColor || '#3498db';
            }}
          />
          <Background 
            color={domainStyling?.theme?.gridColor || '#aaa'} 
            gap={16} 
          />
        </ReactFlow>
      </div>

      <div className="graph-help">
        <p>💡 <strong>How to use:</strong></p>
        <ul>
          <li>Select node type and add nodes</li>
          <li>Select edge type, then drag between nodes to connect</li>
          <li>Click and drag nodes to reposition</li>
          <li>Select nodes and press Delete to remove</li>
        </ul>
      </div>
    </div>
  );
}

export default GraphEditor;
