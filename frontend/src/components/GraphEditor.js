import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphEditor.css';

const VALID_REACTFLOW_EDGE_TYPES = ['default', 'straight', 'step', 'smoothstep', 'bezier'];

function GraphEditor({ graph, domainInfo, domainStyling, onGraphChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges || []);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [validationError, setValidationError] = useState('');
  const updateTimeoutRef = useRef(null);

  // Grid-based positioning for new nodes
  const nodePositionGrid = useRef({ x: 50, y: 50, columns: 0 });

  // Update local state when graph prop changes
  React.useEffect(() => {
    if (graph.nodes) setNodes(graph.nodes);
    if (graph.edges) setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  // Debounced update to parent - prevents excessive re-renders
  React.useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onGraphChange({ nodes, edges });
    }, 300); // Debounce for 300ms

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
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

  // Apply domain styling to edges - wrap in useCallback
  const getEdgeStyle = useCallback((edgeType) => {
    if (!domainStyling || !domainStyling.edge_styles) return {};
    
    const style = domainStyling.edge_styles[edgeType] || {};
    return {
      stroke: style.stroke || '#999',
      strokeWidth: style.strokeWidth || 2,
      strokeDasharray: style.strokeDasharray || undefined
    };
  }, [domainStyling]);

  // Get layer color based on node type
  const getLayerInfo = (nodeType) => {
    const nodeTypeInfo = domainInfo?.node_types.find(nt => nt.name === nodeType);
    const layer = nodeTypeInfo?.default_attributes?.layer || 'unknown';
    
    let layerColor = '#95a5a6';
    let layerName = 'Unknown';
    
    if (layer === 'form') {
      layerColor = domainStyling?.theme?.formLayerColor || '#3498db';
      layerName = 'Form';
    } else if (layer === 'function') {
      layerColor = domainStyling?.theme?.functionLayerColor || '#9b59b6';
      layerName = 'Function';
    } else if (layer === 'failure') {
      layerColor = domainStyling?.theme?.failureLayerColor || '#e74c3c';
      layerName = 'Failure';
    }
    
    return { layer, layerColor, layerName };
  };

  const onConnect = useCallback(
    (params) => {
      const edgeType = selectedEdgeType || (domainInfo?.edge_types[0]?.name || 'default');
      const edgeStyle = getEdgeStyle(edgeType);
      // Map domain edge type to a ReactFlow built-in type; fall back to 'default'
      const reactFlowType = domainStyling?.edge_styles?.[edgeType]?.type || 'default';
      const resolvedType = VALID_REACTFLOW_EDGE_TYPES.includes(reactFlowType) ? reactFlowType : 'default';
      
      setEdges((eds) =>
        addEdge({
          ...params,
          type: resolvedType,
          data: { edgeType },
          animated: domainStyling?.edge_styles?.[edgeType]?.animated || false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: edgeStyle
        }, eds)
      );
    },
    [selectedEdgeType, domainInfo, domainStyling, setEdges, getEdgeStyle]
  );

  // Smart grid-based positioning
  const getNextNodePosition = () => {
    const grid = nodePositionGrid.current;
    const spacing = 200;
    const maxColumns = 4;
    
    const position = { x: grid.x, y: grid.y };
    
    // Move to next position
    grid.columns++;
    if (grid.columns >= maxColumns) {
      grid.columns = 0;
      grid.x = 50;
      grid.y += spacing;
    } else {
      grid.x += spacing;
    }
    
    return position;
  };

  // Check for duplicate labels - exact match
  const isDuplicateLabel = (label) => {
    const normalizedLabel = label.trim().toLowerCase();
    return nodes.some(node => {
      const existingLabel = node.data.label.replace(/^[^\s]+\s/, '').trim().toLowerCase(); // Remove emoji
      return existingLabel === normalizedLabel;
    });
  };

  const addNode = () => {
    setValidationError('');
    
    if (!nodeLabel.trim()) {
      setValidationError('Please enter a node label');
      return;
    }
    
    if (!selectedNodeType) {
      setValidationError('Please select a node type');
      return;
    }

    if (isDuplicateLabel(nodeLabel)) {
      if (!window.confirm(`A node with similar label "${nodeLabel}" already exists. Add anyway?`)) {
        return;
      }
    }

    const nodeType = selectedNodeType;
    const nodeStyle = getNodeStyle(nodeType);
    const icon = domainInfo?.node_types.find(nt => nt.name === nodeType)?.icon || '';
    const defaultAttrs = domainInfo?.node_types.find(nt => nt.name === nodeType)?.default_attributes || {};
    const { layer, layerColor } = getLayerInfo(nodeType);

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      data: { 
        label: `${icon} ${nodeLabel}`,
        nodeType: nodeType,
        layer: layer,
        attributes: { ...defaultAttrs }
      },
      position: getNextNodePosition(),
      style: {
        ...nodeStyle,
        boxShadow: `0 2px 8px ${layerColor}40`
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setNodeLabel('');
    setValidationError('');
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

  // Group node types by layer
  const groupedNodeTypes = React.useMemo(() => {
    if (!domainInfo?.node_types) return {};
    
    return domainInfo.node_types.reduce((acc, nodeType) => {
      const layer = nodeType.default_attributes?.layer || 'other';
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(nodeType);
      return acc;
    }, {});
  }, [domainInfo]);

  // Get statistics by layer
  const layerStats = React.useMemo(() => {
    const stats = {
      form: { count: 0, color: domainStyling?.theme?.formLayerColor || '#3498db' },
      function: { count: 0, color: domainStyling?.theme?.functionLayerColor || '#9b59b6' },
      failure: { count: 0, color: domainStyling?.theme?.failureLayerColor || '#e74c3c' }
    };
    
    nodes.forEach(node => {
      const layer = node.data?.layer || 'other';
      if (stats[layer]) stats[layer].count++;
    });
    
    return stats;
  }, [nodes, domainStyling]);

  return (
    <div className="graph-editor">
      <div className="graph-toolbar">
        <div className="toolbar-section">
          <h4>Add Node</h4>
          
          {/* Grouped by layer */}
          <select 
            value={selectedNodeType || ''} 
            onChange={(e) => setSelectedNodeType(e.target.value)}
            className="node-type-select"
          >
            <option value="">Select Type...</option>
            
            {groupedNodeTypes.form && groupedNodeTypes.form.length > 0 && (
              <optgroup label="📦 Form Layer (Structure)">
                {groupedNodeTypes.form.map(nt => (
                  <option key={nt.name} value={nt.name}>
                    {nt.icon} {nt.display_name}
                  </option>
                ))}
              </optgroup>
            )}
            
            {groupedNodeTypes.function && groupedNodeTypes.function.length > 0 && (
              <optgroup label="⚙️ Function Layer (Behavior)">
                {groupedNodeTypes.function.map(nt => (
                  <option key={nt.name} value={nt.name}>
                    {nt.icon} {nt.display_name}
                  </option>
                ))}
              </optgroup>
            )}
            
            {groupedNodeTypes.failure && groupedNodeTypes.failure.length > 0 && (
              <optgroup label="⚠️ Failure Layer (Risk)">
                {groupedNodeTypes.failure.map(nt => (
                  <option key={nt.name} value={nt.name}>
                    {nt.icon} {nt.display_name}
                  </option>
                ))}
              </optgroup>
            )}
            
            {groupedNodeTypes.other && groupedNodeTypes.other.length > 0 && (
              <optgroup label="Other">
                {groupedNodeTypes.other.map(nt => (
                  <option key={nt.name} value={nt.name}>
                    {nt.icon} {nt.display_name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          
          <input
            type="text"
            placeholder="Node label"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addNode()}
            className={validationError ? 'error' : ''}
          />
          <button onClick={addNode} className="btn btn-add">
            ➕ Add Node
          </button>
          
          {validationError && (
            <span className="validation-error">{validationError}</span>
          )}
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
          
          {/* Layer statistics panel */}
          <Panel position="top-right" className="layer-stats-panel">
            <div className="layer-stats">
              <div className="layer-stat" style={{ borderLeftColor: layerStats.form.color }}>
                <span className="layer-name">Form</span>
                <span className="layer-count">{layerStats.form.count}</span>
              </div>
              <div className="layer-stat" style={{ borderLeftColor: layerStats.function.color }}>
                <span className="layer-name">Function</span>
                <span className="layer-count">{layerStats.function.count}</span>
              </div>
              <div className="layer-stat" style={{ borderLeftColor: layerStats.failure.color }}>
                <span className="layer-name">Failure</span>
                <span className="layer-count">{layerStats.failure.count}</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <div className="graph-help">
        <p>💡 <strong>Universal Graph Architecture:</strong></p>
        <ul>
          <li><strong>Form Layer (📦):</strong> Physical/logical structure - Components, Systems</li>
          <li><strong>Function Layer (⚙️):</strong> Behavioral structure - What the system DOES</li>
          <li><strong>Failure Layer (⚠️):</strong> Risk structure - What can go WRONG</li>
          <li>Drag nodes to reposition • Connect nodes with edges • Delete key to remove</li>
        </ul>
      </div>
    </div>
  );
}

export default GraphEditor;
