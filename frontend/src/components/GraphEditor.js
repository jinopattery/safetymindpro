import React, { useState, useCallback, useRef, useEffect } from 'react';
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

// Layer definitions
const LAYERS = [
  {
    id: 'form',
    label: 'Structure',
    title: 'Physical / Logical Structure',
    shortcut: '1',
  },
  {
    id: 'function',
    label: 'Behavior',
    title: 'Behavioral Structure',
    shortcut: '2',
  },
  {
    id: 'failure',
    label: 'Risk',
    title: 'Risk Structure',
    shortcut: '3',
  },
];

function GraphEditor({ graph, domainInfo, domainStyling, onGraphChange, activeLayer, onLayerChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges || []);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [validationError, setValidationError] = useState('');
  const updateTimeoutRef = useRef(null);
  const labelInputRef = useRef(null);
  const nodeSelectRef = useRef(null);

  // Grid-based positioning
  const nodePositionGrid = useRef({ x: 60, y: 60, columns: 0 });

  // Sync from parent prop
  useEffect(() => {
    if (graph.nodes) setNodes(graph.nodes);
    if (graph.edges) setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  // Debounce propagation to parent
  useEffect(() => {
    clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      onGraphChange({ nodes, edges });
    }, 300);
    return () => clearTimeout(updateTimeoutRef.current);
  }, [nodes, edges, onGraphChange]);

  // Group node types by layer
  const groupedNodeTypes = React.useMemo(() => {
    if (!domainInfo?.node_types) return {};
    return domainInfo.node_types.reduce((acc, nt) => {
      const layer = nt.default_attributes?.layer || 'other';
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(nt);
      return acc;
    }, {});
  }, [domainInfo]);

  // Auto-select first node type when layer changes
  useEffect(() => {
    const types = groupedNodeTypes[activeLayer] || [];
    setSelectedNodeType(types.length > 0 ? types[0].name : null);
    setValidationError('');
  }, [activeLayer, groupedNodeTypes]);

  // Global keyboard shortcuts: Alt+1/2/3 to switch layers
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      if (e.key === '1') { e.preventDefault(); onLayerChange('form'); }
      if (e.key === '2') { e.preventDefault(); onLayerChange('function'); }
      if (e.key === '3') { e.preventDefault(); onLayerChange('failure'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onLayerChange]);

  const getNodeStyle = (nodeType) => {
    if (!domainStyling?.node_styles) return {};
    const s = domainStyling.node_styles[nodeType] || {};
    return {
      background: s.backgroundColor || '#fff',
      color: s.color || '#1e293b',
      border: `1px solid ${s.borderColor || '#cbd5e1'}`,
      borderRadius: '4px',
      padding: '6px 10px',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    };
  };

  const getEdgeStyle = useCallback((edgeType) => {
    if (!domainStyling?.edge_styles) return {};
    const s = domainStyling.edge_styles[edgeType] || {};
    return {
      stroke: s.stroke || '#94a3b8',
      strokeWidth: s.strokeWidth || 1.5,
      strokeDasharray: s.strokeDasharray || undefined,
    };
  }, [domainStyling]);

  const getNextNodePosition = () => {
    const grid = nodePositionGrid.current;
    const spacing = 180;
    const maxColumns = 5;
    const pos = { x: grid.x, y: grid.y };
    grid.columns++;
    if (grid.columns >= maxColumns) {
      grid.columns = 0;
      grid.x = 60;
      grid.y += spacing;
    } else {
      grid.x += spacing;
    }
    return pos;
  };

  const isDuplicateLabel = (label) => {
    const norm = label.trim().toLowerCase();
    return nodes.some(n => {
      const existing = n.data.label.replace(/^[^\s]+\s/, '').trim().toLowerCase();
      return existing === norm;
    });
  };

  const addNode = () => {
    setValidationError('');
    if (!nodeLabel.trim()) {
      setValidationError('Enter a node label');
      labelInputRef.current?.focus();
      return;
    }
    if (!selectedNodeType) {
      setValidationError('Select a node type');
      nodeSelectRef.current?.focus();
      return;
    }
    if (isDuplicateLabel(nodeLabel)) {
      if (!window.confirm(`"${nodeLabel}" already exists. Add anyway?`)) return;
    }

    const nodeStyle = getNodeStyle(selectedNodeType);
    const nt = domainInfo?.node_types.find(n => n.name === selectedNodeType);
    const icon = nt?.icon || '';
    const defaultAttrs = nt?.default_attributes || {};
    const layer = defaultAttrs.layer || activeLayer;
    const layerColor = domainStyling?.theme?.[`${layer}LayerColor`] || '#6366f1';

    setNodes(nds => nds.concat({
      id: `node-${Date.now()}`,
      type: 'default',
      data: {
        label: icon ? `${icon} ${nodeLabel}` : nodeLabel,
        nodeType: selectedNodeType,
        layer,
        attributes: { ...defaultAttrs },
      },
      position: getNextNodePosition(),
      style: { ...nodeStyle, boxShadow: `0 1px 4px ${layerColor}30` },
    }));
    setNodeLabel('');
    labelInputRef.current?.focus();
  };

  const onConnect = useCallback(
    (params) => {
      const edgeType = selectedEdgeType || domainInfo?.edge_types[0]?.name || 'default';
      const edgeStyle = getEdgeStyle(edgeType);
      const reactFlowType = domainStyling?.edge_styles?.[edgeType]?.type || 'default';
      setEdges(eds => addEdge({
        ...params,
        type: reactFlowType,
        data: { edgeType },
        animated: domainStyling?.edge_styles?.[edgeType]?.animated || false,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: edgeStyle,
      }, eds));
    },
    [selectedEdgeType, domainInfo, domainStyling, setEdges, getEdgeStyle]
  );

  const onNodesDelete = useCallback(
    (deleted) => {
      setEdges(eds => eds.filter(
        e => !deleted.some(n => n.id === e.source || n.id === e.target)
      ));
    },
    [setEdges]
  );

  // Layer stats
  const layerStats = React.useMemo(() => {
    const s = { form: 0, function: 0, failure: 0 };
    nodes.forEach(n => {
      const l = n.data?.layer;
      if (l && s[l] !== undefined) s[l]++;
    });
    return s;
  }, [nodes]);

  const currentLayerTypes = groupedNodeTypes[activeLayer] || [];

  return (
    <div className="graph-editor">
      {/* Compact add-node toolbar */}
      <div className="graph-toolbar">
        <select
          ref={nodeSelectRef}
          value={selectedNodeType || ''}
          onChange={e => setSelectedNodeType(e.target.value)}
          className="node-type-select"
          onKeyDown={e => e.key === 'Tab' && e.shiftKey === false && labelInputRef.current?.focus()}
          aria-label="Node type"
          tabIndex={0}
        >
          <option value="">Type…</option>
          {currentLayerTypes.map(nt => (
            <option key={nt.name} value={nt.name}>
              {nt.icon} {nt.display_name}
            </option>
          ))}
        </select>

        <input
          ref={labelInputRef}
          type="text"
          placeholder="Node label (Enter to add)"
          value={nodeLabel}
          onChange={e => setNodeLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addNode(); }
            if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); nodeSelectRef.current?.focus(); }
          }}
          className={`node-label-input${validationError ? ' error' : ''}`}
          aria-label="Node label"
          tabIndex={0}
        />

        <button onClick={addNode} className="btn-add-node" tabIndex={0}>
          Add
        </button>

        {validationError && (
          <span className="validation-error" role="alert">{validationError}</span>
        )}

        {/* Edge type selector */}
        {domainInfo?.edge_types?.length > 1 && (
          <select
            value={selectedEdgeType || ''}
            onChange={e => setSelectedEdgeType(e.target.value)}
            className="edge-type-select"
            aria-label="Edge type"
            tabIndex={0}
          >
            <option value="">Edge…</option>
            {domainInfo.edge_types.map(et => (
              <option key={et.name} value={et.name}>{et.display_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Canvas */}
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
          deleteKeyCode="Delete"
        >
          <Controls />
          <MiniMap
            nodeColor={node => {
              const nt = node.data?.nodeType;
              return domainStyling?.node_styles?.[nt]?.backgroundColor || '#6366f1';
            }}
            style={{ background: '#f8fafc' }}
          />
          <Background color="#e2e8f0" gap={20} size={1} />

          <Panel position="top-right" className="layer-stats-panel">
            {LAYERS.map(l => (
              <div
                key={l.id}
                className={`layer-stat layer-stat-${l.id}`}
                style={{
                  borderLeftColor:
                    domainStyling?.theme?.[`${l.id}LayerColor`] || '#6366f1',
                }}
              >
                <span className="ls-label">{l.label}</span>
                <span className="ls-count">{layerStats[l.id]}</span>
              </div>
            ))}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default GraphEditor;

