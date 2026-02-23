import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  Handle,
  Position,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphEditor.css';

// Layer definitions
const LAYERS = [
  {
    id: 'form',
    label: 'Form',
    title: 'Physical / Logical Structure',
    shortcut: '1',
  },
  {
    id: 'function',
    label: 'Function',
    title: 'Behavioral Structure',
    shortcut: '2',
  },
  {
    id: 'failure',
    label: 'Failure',
    title: 'Risk Structure',
    shortcut: '3',
  },
];

// Strict hierarchy connection rules: [sourceLayer, targetLayer] → edgeType
// Form→Form (child), Form→Function (performs), Form→Failure (has_failure),
// Function→Function (child), Failure→Failure (child)
const HIERARCHY_RULES = [
  { src: 'form',     tgt: 'form',     edgeType: 'form_hierarchy',    hint: 'Form→Form (child)' },
  { src: 'form',     tgt: 'function', edgeType: 'performs_function', hint: 'Form→Function (performs)' },
  { src: 'form',     tgt: 'failure',  edgeType: 'has_failure',       hint: 'Form→Failure (has_failure)' },
  { src: 'function', tgt: 'function', edgeType: 'function_flow',     hint: 'Function→Function (child)' },
  { src: 'failure',  tgt: 'failure',  edgeType: 'failure_propagation', hint: 'Failure→Failure (child)' },
];

const HIERARCHY_ALLOWED_SUMMARY = HIERARCHY_RULES.map(r => r.hint).join(', ');

const HIERARCHY_HINTS_BY_LAYER = {
  form:     HIERARCHY_RULES.filter(r => r.src === 'form').map(r => r.hint).join(' · '),
  function: ['Function→Function (child)', 'To link: draw from a Form node'].join(' · '),
  failure:  ['Failure→Failure (child)',   'To link: draw from a Form node'].join(' · '),
};

// ── Editable node component ────────────────────────────────────────────────
function EditableNode({ id, data, isConnectable, targetPosition = Position.Top, sourcePosition = Position.Bottom }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const { setNodes } = useReactFlow();
  const inputRef = useRef(null);

  const startEdit = useCallback((e) => {
    e.stopPropagation();
    setEditVal(data.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [data.label]);

  const commitEdit = useCallback(() => {
    if (editVal.trim()) {
      setNodes(nds => nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, label: editVal.trim() } } : n
      ));
    }
    setEditing(false);
  }, [editVal, id, setNodes]);

  return (
    <>
      <Handle type="target" position={targetPosition} isConnectable={isConnectable} />
      <div
        className="editable-node-content"
        onDoubleClick={startEdit}
        title={editing ? undefined : 'Double-click to rename'}
      >
        {editing ? (
          <input
            ref={inputRef}
            className="editable-node-input"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') setEditing(false);
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span>{data.label}</span>
        )}
      </div>
      <Handle type="source" position={sourcePosition} isConnectable={isConnectable} />
    </>
  );
}

// Define outside component for stable reference (required by ReactFlow)
const nodeTypes = { default: EditableNode };

// ── Collapsible Horizontal Tree view (used for Function and Failure layers) ──

const NODE_W = 160;
const NODE_H = 34;
const COL_GAP = 60;  // horizontal gap between parent box and children column
const ROW_GAP = 16;  // vertical gap between sibling rows

function buildTreeLayout(layerNodes, edges, childEdgeType) {
  const nodeIds = new Set(layerNodes.map(n => n.id));
  const childMap = {};  // parentId → [childIds]
  const hasParent = new Set();

  edges.forEach(e => {
    if (e.data?.edgeType === childEdgeType && nodeIds.has(e.source) && nodeIds.has(e.target)) {
      if (!childMap[e.source]) childMap[e.source] = [];
      childMap[e.source].push(e.target);
      hasParent.add(e.target);
    }
  });

  const roots = layerNodes.filter(n => !hasParent.has(n.id));

  // compute (col, centerY) for every node via post-order
  const coords = {}; // nodeId → { x, y }
  let rowCounter = 0;

  function measure(nodeId, col) {
    const children = childMap[nodeId] || [];
    if (children.length === 0) {
      const y = rowCounter * (NODE_H + ROW_GAP);
      rowCounter++;
      coords[nodeId] = { x: col * (NODE_W + COL_GAP), y };
      return y + NODE_H / 2;
    }
    const mids = children.map(cid => measure(cid, col + 1));
    const centerY = (mids[0] + mids[mids.length - 1]) / 2 - NODE_H / 2;
    coords[nodeId] = { x: col * (NODE_W + COL_GAP), y: centerY };
    return centerY + NODE_H / 2;
  }

  roots.forEach(r => measure(r.id, 0));

  // Orphan nodes not placed yet
  layerNodes.forEach(n => {
    if (!coords[n.id]) {
      coords[n.id] = { x: 0, y: rowCounter * (NODE_H + ROW_GAP) };
      rowCounter++;
    }
  });

  const totalH = Math.max(rowCounter * (NODE_H + ROW_GAP), 200);
  const maxCol = layerNodes.reduce((m, n) => Math.max(m, coords[n.id]?.x || 0), 0);
  const totalW = maxCol + NODE_W + 60;

  return { coords, childMap, roots, totalW, totalH };
}

function CollapsibleHorizontalTree({ nodes, edges, layer, childEdgeType, accentColor }) {
  const [collapsed, setCollapsed] = React.useState({});
  const containerRef = React.useRef(null);

  const layerNodes = React.useMemo(
    () => nodes.filter(n => n.data?.layer === layer),
    [nodes, layer]
  );

  const { coords, childMap, roots, totalW, totalH } = React.useMemo(
    () => buildTreeLayout(layerNodes, edges, childEdgeType),
    [layerNodes, edges, childEdgeType]
  );

  const toggle = React.useCallback(id =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] })), []);

  // Collect visible edges for SVG rendering
  const svgEdges = React.useMemo(() => {
    const lines = [];
    const visited = new Set();
    function collect(nodeId) {
      if (collapsed[nodeId]) return;
      const children = childMap[nodeId] || [];
      children.forEach(cid => {
        if (!coords[nodeId] || !coords[cid]) return;
        lines.push({ from: nodeId, to: cid });
        if (!visited.has(cid)) { visited.add(cid); collect(cid); }
      });
    }
    roots.forEach(r => collect(r.id));
    return lines;
  }, [roots, childMap, coords, collapsed]);

  // Build set of visible nodes (excluding collapsed subtrees)
  const visibleIds = React.useMemo(() => {
    const vis = new Set();
    function walk(nodeId) {
      vis.add(nodeId);
      if (!collapsed[nodeId]) {
        (childMap[nodeId] || []).forEach(walk);
      }
    }
    roots.forEach(r => walk(r.id));
    return vis;
  }, [roots, childMap, collapsed]);

  if (layerNodes.length === 0) {
    return (
      <div className="chtree-wrap">
        <div className="chtree-empty-msg">
          No {layer} nodes yet. Add nodes from the toolbar above.
        </div>
      </div>
    );
  }

  return (
    <div className="chtree-wrap" ref={containerRef}>
      <div className="chtree-canvas" style={{ width: totalW, height: totalH }}>
        {/* SVG connector lines */}
        <svg
          className="chtree-svg-layer"
          width={totalW}
          height={totalH}
        >
          {svgEdges.map(({ from, to }) => {
            const p = coords[from];
            const c = coords[to];
            const px = p.x + NODE_W;
            const py = p.y + NODE_H / 2;
            const cx = c.x;
            const cy = c.y + NODE_H / 2;
            const mx = (px + cx) / 2;
            return (
              <path
                key={`${from}-${to}`}
                d={`M${px},${py} C${mx},${py} ${mx},${cy} ${cx},${cy}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* Node boxes */}
        {layerNodes.filter(n => visibleIds.has(n.id)).map(n => {
          const pos = coords[n.id];
          if (!pos) return null;
          const children = childMap[n.id] || [];
          const isCollapsed = collapsed[n.id];
          return (
            <div
              key={n.id}
              className="chtree-node-box"
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_W,
                borderLeftColor: accentColor,
              }}
              title={n.data?.label}
            >
              <span className="chtree-node-label">{n.data?.label}</span>
              {children.length > 0 && (
                <button
                  className="chtree-toggle-btn"
                  onClick={() => toggle(n.id)}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? '+' : '−'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── All-Layers Grouped View (ReactFlow with forms as group containers) ──

const CHILD_W = 140;
const CHILD_H = 36;
const GROUP_PAD = 14;
const GROUP_HEADER = 32;
const CHILD_GAP = 10;
const GROUP_H_GAP = 24;
const GROUP_V_GAP = 20;
const COLS_PER_GROUP = 3;

function computeGroupedNodes(nodes, edges) {
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const formFuncs = {};   // formId → [funcIds]
  const formFails = {};   // formId → [failIds]
  const formKids  = {};   // formId → [childFormIds]
  const isChildForm = new Set();

  edges.forEach(e => {
    const t = e.data?.edgeType;
    if (t === 'performs_function') { (formFuncs[e.source] = formFuncs[e.source] || []).push(e.target); }
    if (t === 'has_failure')       { (formFails[e.source] = formFails[e.source] || []).push(e.target); }
    if (t === 'form_hierarchy')    { (formKids[e.source]  = formKids[e.source]  || []).push(e.target);  isChildForm.add(e.target); }
  });

  const rootForms = nodes.filter(n => n.data?.layer === 'form' && !isChildForm.has(n.id));

  const result = [];
  const placedIds = new Set();
  let curY = 0;

  function placeForm(formId, x) {
    const n = nodeMap[formId];
    if (!n) return 0;
    placedIds.add(formId);

    const funcs = formFuncs[formId] || [];
    const fails = formFails[formId] || [];
    const items = [...funcs, ...fails];
    const itemCount = items.length;
    const cols = Math.min(Math.max(itemCount, 1), COLS_PER_GROUP);
    const rows = itemCount > 0 ? Math.ceil(itemCount / cols) : 0;
    const gw = Math.max(160, cols * (CHILD_W + CHILD_GAP) - CHILD_GAP + GROUP_PAD * 2);
    const gh = GROUP_HEADER + (rows > 0 ? rows * (CHILD_H + CHILD_GAP) - CHILD_GAP + GROUP_PAD : GROUP_PAD);

    result.push({
      ...n,
      type: 'group',
      position: { x, y: curY },
      style: {
        width: gw,
        height: gh,
        background: 'rgba(241,245,249,0.9)',
        border: '1.5px dashed #94a3b8',
        borderRadius: 8,
      },
      data: { ...n.data, isGroupParent: true },
    });

    items.forEach((itemId, idx) => {
      const item = nodeMap[itemId];
      if (!item) return;
      placedIds.add(itemId);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      result.push({
        ...item,
        parentId: formId,
        extent: 'parent',
        position: {
          x: GROUP_PAD + col * (CHILD_W + CHILD_GAP),
          y: GROUP_HEADER + row * (CHILD_H + CHILD_GAP),
        },
        style: { ...item.style, width: CHILD_W },
        draggable: false,
      });
    });

    const childForms = formKids[formId] || [];
    let childX = x + gw + GROUP_H_GAP;
    const startY = curY;
    if (childForms.length > 0) {
      curY += gh + GROUP_V_GAP;
      childForms.forEach(cfId => {
        placeForm(cfId, childX);
        curY += GROUP_V_GAP;
      });
      curY = Math.max(curY, startY + gh);
    } else {
      curY += gh + GROUP_V_GAP;
    }
  }

  rootForms.forEach(f => { placeForm(f.id, 0); });

  // orphan nodes not placed (functions/failures not linked to any form)
  nodes.forEach(n => {
    if (!placedIds.has(n.id)) {
      result.push({ ...n });
    }
  });

  return result;
}

function AllLayersGroupedView({ nodes, edges, domainStyling, onGraphChange, onNodesChange, onEdgesChange, onConnect, onNodesDelete }) {
  const groupedNodes = React.useMemo(() => computeGroupedNodes(nodes, edges), [nodes, edges]);

  const layerStats = React.useMemo(() => {
    const s = { form: 0, function: 0, failure: 0 };
    nodes.forEach(n => { const l = n.data?.layer; if (l && s[l] !== undefined) s[l]++; });
    return s;
  }, [nodes]);

  return (
    <div className="graph-canvas graph-canvas--all">
      <ReactFlow
        nodes={groupedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
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
            <div key={l.id} className={`layer-stat layer-stat-${l.id}`}
              style={{ borderLeftColor: domainStyling?.theme?.[`${l.id}LayerColor`] || '#6366f1' }}>
              <span className="ls-label">{l.label}</span>
              <span className="ls-count">{layerStats[l.id]}</span>
            </div>
          ))}
        </Panel>
      </ReactFlow>
    </div>
  );
}


function GraphEditor({ graph, domainInfo, domainStyling, onGraphChange, activeLayer, onLayerChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges || []);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
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

  // Filter nodes/edges for canvas view based on active layer
  // Uses ReactFlow's `hidden` property to hide nodes/edges without removing them from state
  const displayedNodes = React.useMemo(() => {
    if (activeLayer === 'all') return nodes.map(n => ({ ...n, hidden: false }));
    return nodes.map(n => ({ ...n, hidden: n.data?.layer !== activeLayer }));
  }, [nodes, activeLayer]);

  const displayedEdges = React.useMemo(() => {
    if (activeLayer === 'all') return edges.map(e => ({ ...e, hidden: false }));
    const visibleIds = new Set(displayedNodes.filter(n => !n.hidden).map(n => n.id));
    return edges.map(e => ({ ...e, hidden: !visibleIds.has(e.source) || !visibleIds.has(e.target) }));
  }, [edges, displayedNodes, activeLayer]);

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
    const effectiveLayer = activeLayer === 'all' ? 'form' : activeLayer;
    const types = groupedNodeTypes[effectiveLayer] || [];
    setSelectedNodeType(types.length > 0 ? types[0].name : null);
    setValidationError('');
  }, [activeLayer, groupedNodeTypes]);

  // Global keyboard shortcuts: Alt+1/2/3 to switch layers, Alt+0 for all
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      if (e.key === '1') { e.preventDefault(); onLayerChange('form'); }
      if (e.key === '2') { e.preventDefault(); onLayerChange('function'); }
      if (e.key === '3') { e.preventDefault(); onLayerChange('failure'); }
      if (e.key === '0') { e.preventDefault(); onLayerChange('all'); }
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

  // Determine the required edge type based on the strict layer hierarchy.
  // Rules are defined in HIERARCHY_RULES above.
  const getHierarchyEdgeType = useCallback((srcLayer, tgtLayer) => {
    const rule = HIERARCHY_RULES.find(r => r.src === srcLayer && r.tgt === tgtLayer);
    return rule ? rule.edgeType : null;
  }, []);

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const srcLayer = sourceNode.data?.layer;
      const tgtLayer = targetNode.data?.layer;
      const edgeType = getHierarchyEdgeType(srcLayer, tgtLayer);

      if (!edgeType) {
        setValidationError(
          `Cannot connect ${srcLayer} → ${tgtLayer}. Allowed: ${HIERARCHY_ALLOWED_SUMMARY}.`
        );
        return;
      }

      setValidationError('');
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
    [nodes, getHierarchyEdgeType, domainStyling, setEdges, getEdgeStyle]
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

  const currentLayerTypes = activeLayer === 'all'
    ? Object.values(groupedNodeTypes).flat()
    : (groupedNodeTypes[activeLayer] || []);

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

        {/* Hierarchy connection hint derived from HIERARCHY_HINTS_BY_LAYER */}
        <span className="hierarchy-hint">
          {HIERARCHY_HINTS_BY_LAYER[activeLayer] || ''}
        </span>
      </div>

      {/* Canvas – varies by layer */}
      {activeLayer === 'function' ? (
        <CollapsibleHorizontalTree
          nodes={nodes}
          edges={edges}
          layer="function"
          childEdgeType="function_flow"
          accentColor={domainStyling?.theme?.functionLayerColor || '#8b5cf6'}
        />
      ) : activeLayer === 'failure' ? (
        <CollapsibleHorizontalTree
          nodes={nodes}
          edges={edges}
          layer="failure"
          childEdgeType="failure_propagation"
          accentColor={domainStyling?.theme?.failureLayerColor || '#ef4444'}
        />
      ) : activeLayer === 'all' ? (
        <AllLayersGroupedView
          nodes={nodes}
          edges={edges}
          domainStyling={domainStyling}
          onGraphChange={onGraphChange}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
        />
      ) : (
        <div className={`graph-canvas graph-canvas--${activeLayer}`}>
          <ReactFlow
            nodes={displayedNodes}
            edges={displayedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
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
      )}
    </div>
  );
}

export default GraphEditor;

