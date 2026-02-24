import React, { useState, useRef, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphEditor.css';


// Form→Form (child), Form→Function (performs), Form→Failure (has_failure),
// Function→Function (child), Failure→Failure (child)
const HIERARCHY_RULES = [
  { src: 'form',     tgt: 'form',     edgeType: 'form_hierarchy',    hint: 'Form→Form (child)' },
  { src: 'form',     tgt: 'function', edgeType: 'performs_function', hint: 'Form→Function (performs)' },
  { src: 'form',     tgt: 'failure',  edgeType: 'has_failure',       hint: 'Form→Failure (has_failure)' },
  { src: 'function', tgt: 'function', edgeType: 'function_flow',     hint: 'Function→Function (child)' },
  { src: 'failure',  tgt: 'failure',  edgeType: 'failure_propagation', hint: 'Failure→Failure (child)' },
];


const HIERARCHY_HINTS_BY_LAYER = {
  form:     HIERARCHY_RULES.filter(r => r.src === 'form').map(r => r.hint).join(' · '),
  function: ['Function→Function (child)', 'To link: draw from a Form node'].join(' · '),
  failure:  ['Failure→Failure (child)',   'To link: draw from a Form node'].join(' · '),
};

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

// ── Cascaded Tree Map – grows both vertically and horizontally ─────────────
//
// Form nodes are laid out as a horizontal tree (root on the left, children to
// the right). Each form box also lists its function and failure chip-links
// inline. The whole canvas auto-sizes to its content so scrolling in both
// axes is supported without any hard-coded dimensions.
//
// Layout constants
const CTM_NODE_W  = 220;   // form node box width
const CTM_HDR_H  = 36;    // fixed header height
const CTM_CHIP_H = 26;    // height allocated per chip row inside a node
const CTM_CHIPS_PER_ROW = 2;  // chips per row inside a node box
const CTM_NODE_VPAD = 10;  // bottom padding inside node box
const CTM_COL_GAP = 72;   // horizontal gap between parent & child columns
const CTM_ROW_GAP = 16;   // vertical gap between sibling subtrees

function ctmNodeHeight(formId, formFuncs, formFails) {
  const nf = (formFuncs[formId] || []).length;
  const na = (formFails[formId] || []).length;
  if (nf === 0 && na === 0) return CTM_HDR_H + CTM_NODE_VPAD;
  const rows = Math.ceil(nf / CTM_CHIPS_PER_ROW) + Math.ceil(na / CTM_CHIPS_PER_ROW);
  return CTM_HDR_H + rows * CTM_CHIP_H + CTM_NODE_VPAD;
}

function buildCascadedLayout(formNodes, formKids, formFuncs, formFails, isChildForm, collapsed) {
  const coords = {};  // id → { x, y, h }
  let nextY = 0;

  const roots = formNodes.filter(n => !isChildForm.has(n.id));

  function measure(nodeId, col) {
    const h = ctmNodeHeight(nodeId, formFuncs, formFails);
    const x = col * (CTM_NODE_W + CTM_COL_GAP);
    const kids = collapsed[nodeId] ? [] : (formKids[nodeId] || []);

    if (kids.length === 0) {
      const y = nextY;
      coords[nodeId] = { x, y, h };
      nextY += h + CTM_ROW_GAP;
      return y + h / 2;   // vertical midpoint
    }

    // Lay out children first, then center parent on their span
    const mids = kids.map(cid => measure(cid, col + 1));
    const spanMid = (mids[0] + mids[mids.length - 1]) / 2;
    coords[nodeId] = { x, y: spanMid - h / 2, h };
    return spanMid;
  }

  roots.forEach(r => measure(r.id, 0));

  // Orphan form nodes not reachable from any root
  formNodes.forEach(n => {
    if (!coords[n.id]) {
      const h = ctmNodeHeight(n.id, formFuncs, formFails);
      coords[n.id] = { x: 0, y: nextY, h };
      nextY += h + CTM_ROW_GAP;
    }
  });

  const allCoords = Object.values(coords);
  const minY = allCoords.length ? Math.min(...allCoords.map(c => c.y)) : 0;
  const maxX = allCoords.length ? Math.max(...allCoords.map(c => c.x)) : 0;
  const maxY = allCoords.length ? Math.max(...allCoords.map(c => c.y + c.h)) : 200;

  // Normalise so top-left is (0,0) — only one pass needed since allCoords
  // holds references to the same objects stored in coords.
  if (minY < 0) {
    allCoords.forEach(c => { c.y -= minY; });
  }

  return {
    coords,
    roots,
    totalW: maxX + CTM_NODE_W + 60,
    totalH: (maxY - Math.min(minY, 0)) + 40,
  };
}

function CascadedTreeMap({ nodes, edges, domainStyling, setEdges }) {
  const [collapsed, setCollapsed] = React.useState({});
  const [dragOver, setDragOver]   = React.useState(null);

  const nodeMap = React.useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const { formFuncs, formFails, formKids, isChildForm, linkedFuncIds, linkedFailIds } =
    React.useMemo(() => {
      const ff = {}, fa = {}, fk = {}, icf = new Set(), lfi = new Set(), lai = new Set();
      edges.forEach(e => {
        const t = e.data?.edgeType;
        if (t === 'performs_function') { (ff[e.source] = ff[e.source] || []).push(e.target); lfi.add(e.target); }
        if (t === 'has_failure')       { (fa[e.source] = fa[e.source] || []).push(e.target); lai.add(e.target); }
        if (t === 'form_hierarchy')    { (fk[e.source] = fk[e.source] || []).push(e.target); icf.add(e.target); }
      });
      return { formFuncs: ff, formFails: fa, formKids: fk, isChildForm: icf, linkedFuncIds: lfi, linkedFailIds: lai };
    }, [edges]);

  const formNodes = React.useMemo(
    () => nodes.filter(n => n.data?.layer === 'form'),
    [nodes]
  );

  const unallocated = React.useMemo(() => ({
    functions: nodes.filter(n => n.data?.layer === 'function' && !linkedFuncIds.has(n.id)),
    failures:  nodes.filter(n => n.data?.layer === 'failure'  && !linkedFailIds.has(n.id)),
  }), [nodes, linkedFuncIds, linkedFailIds]);

  const { coords, roots, totalW, totalH } = React.useMemo(
    () => buildCascadedLayout(formNodes, formKids, formFuncs, formFails, isChildForm, collapsed),
    [formNodes, formKids, formFuncs, formFails, isChildForm, collapsed]
  );

  const toggle = React.useCallback(
    id => setCollapsed(prev => ({ ...prev, [id]: !prev[id] })), []
  );

  const handleDrop = React.useCallback((formId, e) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { id: nodeId, layer } = JSON.parse(e.dataTransfer.getData('text/plain'));
      const edgeType = layer === 'function' ? 'performs_function' : 'has_failure';
      setEdges(eds => {
        if (eds.some(ed => ed.source === formId && ed.target === nodeId && ed.data?.edgeType === edgeType)) return eds;
        return [...eds, {
          id: `e-${formId}-${nodeId}-${Date.now()}`,
          source: formId,
          target: nodeId,
          data: { edgeType },
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
        }];
      });
    } catch (_) { /* ignore malformed drag data */ }
  }, [setEdges]);

  const funcColor = domainStyling?.theme?.functionLayerColor || '#8b5cf6';
  const failColor = domainStyling?.theme?.failureLayerColor || '#ef4444';
  const formColor = domainStyling?.theme?.formLayerColor    || '#3b82f6';

  // Build SVG connector edges for parent→child form links
  const svgEdges = React.useMemo(() => {
    const lines = [];
    const visited = new Set();
    function collect(nodeId) {
      if (collapsed[nodeId]) return;
      (formKids[nodeId] || []).forEach(cid => {
        if (!coords[nodeId] || !coords[cid]) return;
        lines.push({ from: nodeId, to: cid });
        if (!visited.has(cid)) { visited.add(cid); collect(cid); }
      });
    }
    roots.forEach(r => collect(r.id));
    return lines;
  }, [roots, formKids, coords, collapsed]);

  if (formNodes.length === 0) {
    return (
      <div className="ctmap-wrap">
        <div className="chtree-empty-msg">No form nodes yet. Add nodes from the toolbar above.</div>
      </div>
    );
  }

  return (
    <div className="ctmap-wrap">
      {/* Scrollable canvas */}
      <div className="ctmap-scroll">
        <div className="ctmap-canvas" style={{ width: totalW, height: totalH }}>
          {/* SVG connector lines between parent and child forms */}
          <svg className="ctmap-svg" width={totalW} height={totalH}>
            {svgEdges.map(({ from, to }) => {
              const p = coords[from];
              const c = coords[to];
              if (!p || !c) return null;
              const px = p.x + CTM_NODE_W;
              const py = p.y + p.h / 2;
              const cx = c.x;
              const cy = c.y + c.h / 2;
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

          {/* Form node boxes */}
          {formNodes.map(n => {
            const pos = coords[n.id];
            if (!pos) return null;
            const kids  = formKids[n.id]  || [];
            const funcs = formFuncs[n.id] || [];
            const fails = formFails[n.id] || [];
            const isCol   = !!collapsed[n.id];
            const isTarget = dragOver === n.id;

            return (
              <div
                key={n.id}
                className={`ctmap-node${isTarget ? ' ctmap-drag-over' : ''}`}
                style={{ left: pos.x, top: pos.y, width: CTM_NODE_W, minHeight: pos.h,
                         borderLeftColor: formColor }}
                onDragOver={e => { e.preventDefault(); setDragOver(n.id); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
                onDrop={e => handleDrop(n.id, e)}
              >
                {/* Header row */}
                <div className="ctmap-node-header">
                  <span className="ctmap-node-label" title={n.data?.label}>{n.data?.label}</span>
                  <div className="ctmap-badges">
                    {funcs.length > 0 && (
                      <span className="ctmap-badge"
                        style={{ background: funcColor + '22', color: funcColor, borderColor: funcColor }}>
                        {funcs.length} fn
                      </span>
                    )}
                    {fails.length > 0 && (
                      <span className="ctmap-badge"
                        style={{ background: failColor + '22', color: failColor, borderColor: failColor }}>
                        {fails.length} fail
                      </span>
                    )}
                  </div>
                  {(kids.length > 0 || funcs.length > 0 || fails.length > 0) && (
                    <button className="ctmap-toggle" onClick={() => toggle(n.id)}
                      title={isCol ? 'Expand' : 'Collapse'}>
                      {isCol ? '+' : '−'}
                    </button>
                  )}
                </div>

                {/* Chip rows when expanded */}
                {!isCol && (funcs.length > 0 || fails.length > 0) && (
                  <div className="ctmap-chips">
                    {funcs.map(fid => nodeMap[fid] && (
                      <span key={fid} className="ctmap-chip ctmap-chip-func"
                        style={{ borderColor: funcColor }} title={nodeMap[fid].data?.label}>
                        {nodeMap[fid].data?.label}
                      </span>
                    ))}
                    {fails.map(fid => nodeMap[fid] && (
                      <span key={fid} className="ctmap-chip ctmap-chip-fail"
                        style={{ borderColor: failColor }} title={nodeMap[fid].data?.label}>
                        {nodeMap[fid].data?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unallocated nodes tray */}
      {(unallocated.functions.length > 0 || unallocated.failures.length > 0) && (
        <div className="ctmap-unallocated">
          <div className="ctmap-unallocated-header">Unallocated — drag into a form above</div>
          <div className="ctmap-unallocated-items">
            {unallocated.functions.map(n => (
              <div key={n.id}
                className="ctmap-chip ctmap-chip-func ctmap-chip-draggable"
                style={{ borderColor: funcColor }}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ id: n.id, layer: 'function' }))}
                title={`Drag to assign: ${n.data?.label}`}>
                {n.data?.label}
              </div>
            ))}
            {unallocated.failures.map(n => (
              <div key={n.id}
                className="ctmap-chip ctmap-chip-fail ctmap-chip-draggable"
                style={{ borderColor: failColor }}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ id: n.id, layer: 'failure' }))}
                title={`Drag to assign: ${n.data?.label}`}>
                {n.data?.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function GraphEditor({ graph, domainInfo, domainStyling, onGraphChange, activeLayer, onLayerChange }) {
  const [nodes, setNodes] = useNodesState(graph.nodes || []);
  const [edges, setEdges] = useEdgesState(graph.edges || []);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [validationError, setValidationError] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [zoomLocked, setZoomLocked] = useState(false);
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

  // Zoom keyboard shortcuts: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset
  useEffect(() => {
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom(z => zoomLocked ? z : +(Math.min(2.0, z + 0.25)).toFixed(2));
      }
      if (e.key === '-') {
        e.preventDefault();
        setZoom(z => zoomLocked ? z : +(Math.max(0.25, z - 0.25)).toFixed(2));
      }
      if (e.key === '0') {
        e.preventDefault();
        if (!zoomLocked) setZoom(1.0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomLocked]);

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

  const currentLayerTypes = activeLayer === 'all'
    ? Object.values(groupedNodeTypes).flat()
    : (groupedNodeTypes[activeLayer] || []);

  const zoomIn    = () => setZoom(z => zoomLocked ? z : +(Math.min(2.0, z + 0.25)).toFixed(2));
  const zoomOut   = () => setZoom(z => zoomLocked ? z : +(Math.max(0.25, z - 0.25)).toFixed(2));
  const zoomReset = () => { if (!zoomLocked) setZoom(1.0); };

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

      {/* Canvas – varies by layer, with zoom controls overlay */}
      <div className="graph-canvas">
        {/* Zoom controls – left side of canvas */}
        <div className="canvas-zoom-controls">
          <button
            className="canvas-zoom-btn"
            onClick={zoomIn}
            disabled={zoomLocked || zoom >= 2.0}
            title="Zoom in (Ctrl++)"
            aria-label="Zoom in"
          >＋</button>
          <button
            className="canvas-zoom-btn canvas-zoom-pct"
            onClick={zoomReset}
            disabled={zoomLocked}
            title="Reset zoom (Ctrl+0)"
            aria-label={`Current zoom ${Math.round(zoom * 100)}%`}
          >{Math.round(zoom * 100)}%</button>
          <button
            className="canvas-zoom-btn"
            onClick={zoomOut}
            disabled={zoomLocked || zoom <= 0.25}
            title="Zoom out (Ctrl+-)"
            aria-label="Zoom out"
          >－</button>
          <button
            className={`canvas-zoom-btn${zoomLocked ? ' canvas-zoom-locked' : ''}`}
            onClick={() => setZoomLocked(l => !l)}
            title={zoomLocked ? 'Unlock zoom' : 'Lock zoom'}
            aria-label={zoomLocked ? 'Unlock zoom' : 'Lock zoom'}
          >{zoomLocked ? '🔒' : '🔓'}</button>
        </div>

        {/* Scrollable + zoomable content area */}
        <div className="canvas-scroll-outer">
          <div className="canvas-zoom-scaler" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, minHeight: `${100 / zoom}%` }}>
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
            ) : activeLayer === 'form' ? (
              <CollapsibleHorizontalTree
                nodes={nodes}
                edges={edges}
                layer="form"
                childEdgeType="form_hierarchy"
                accentColor={domainStyling?.theme?.formLayerColor || '#3b82f6'}
              />
            ) : (
              <CascadedTreeMap
                nodes={nodes}
                edges={edges}
                domainStyling={domainStyling}
                setEdges={setEdges}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GraphEditor;

