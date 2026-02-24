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

// ── Cascaded Tree Map – All-Layers nested treemap view ────────────────────
//
// Implements the cascaded / nested treemap concept:
// https://observablehq.com/@d3/cascaded-treemap
//
// Each form node is rendered as a space-filling rectangle. Sub-form nodes are
// tiled as nested rectangles inside their parent's inner area. Function and
// failure nodes appear as proportionally-sized leaf cells within their owning
// form's rectangle. The layout alternates horizontal/vertical tiling at each
// depth level (slice-and-dice), giving a clean cascaded appearance.

const NTM_HEADER_H    = 22;  // header strip height inside each form rect
const NTM_PAD         = 3;   // padding between parent edge and children
const NTM_MIN_LABEL_W = 38;  // minimum rect width to attempt a text label
const NTM_MIN_LABEL_H = 13;  // minimum rect height to attempt a text label

// Depth-indexed fill / stroke palettes for form nodes (mirrors Observable's
// cascaded-treemap colour scheme: each depth level gets a distinct hue).
const NTM_FORM_FILL   = ['#dbeafe', '#ede9fe', '#d1fae5', '#fef3c7', '#fce7f3'];
const NTM_FORM_STROKE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

// Compute the leaf-weight of a form sub-tree.  Used to size rectangles so
// that nodes with more content get proportionally more area.
function ntmWeight(id, formKids, formFuncs, formFails) {
  const kids  = formKids[id]  || [];
  const funcs = formFuncs[id] || [];
  const fails = formFails[id] || [];
  const leafCount = funcs.length + fails.length;
  if (kids.length === 0) return Math.max(1, leafCount);
  return kids.reduce((s, k) => s + ntmWeight(k, formKids, formFuncs, formFails), 0)
    + leafCount;
}

// Tile an array of items (each with a .weight property) into a bounding rect.
// Uses horizontal slicing when width >= height, vertical otherwise.
// Each item receives .x, .y, .w, .h.
function ntmTile(items, x, y, w, h) {
  if (!items.length || w <= 0 || h <= 0) return;
  const total = items.reduce((s, i) => s + Math.max(0.001, i.weight), 0);
  if (w >= h) {
    let xOff = x;
    items.forEach(item => {
      const iw = (Math.max(0.001, item.weight) / total) * w;
      item.x = xOff; item.y = y; item.w = iw; item.h = h;
      xOff += iw;
    });
  } else {
    let yOff = y;
    items.forEach(item => {
      const ih = (Math.max(0.001, item.weight) / total) * h;
      item.x = x; item.y = yOff; item.w = w; item.h = ih;
      yOff += ih;
    });
  }
}

// Recursively compute the full layout for a form node and its descendants.
// Returns an array of render items: { id, type, x, y, w, h, depth, label }.
function ntmLayout(formId, x, y, w, h, depth, formKids, formFuncs, formFails, nodeMap, result) {
  result.push({
    id: formId, type: 'form', x, y, w, h, depth,
    label: nodeMap[formId]?.data?.label || formId,
  });

  const kids  = (formKids[formId]  || []).map(k => ({ id: k, type: 'form',     weight: ntmWeight(k, formKids, formFuncs, formFails) }));
  const funcs = (formFuncs[formId] || []).map(f => ({ id: f, type: 'function', weight: 1 }));
  const fails = (formFails[formId] || []).map(f => ({ id: f, type: 'failure',  weight: 1 }));
  const children = [...kids, ...funcs, ...fails];

  if (!children.length) return;

  const innerX = x + NTM_PAD;
  const innerY = y + NTM_HEADER_H;
  const innerW = w - 2 * NTM_PAD;
  const innerH = h - NTM_HEADER_H - NTM_PAD;

  if (innerW < 1 || innerH < 1) return;

  ntmTile(children, innerX, innerY, innerW, innerH);

  // Recurse into sub-form children
  kids.forEach(k => ntmLayout(k.id, k.x, k.y, k.w, k.h, depth + 1,
    formKids, formFuncs, formFails, nodeMap, result));

  // Record leaf rects for function / failure nodes
  [...funcs, ...fails].forEach(item =>
    result.push({
      id: item.id, type: item.type,
      x: item.x, y: item.y, w: item.w, h: item.h, depth,
      label: nodeMap[item.id]?.data?.label || item.id,
    })
  );
}

// Build the complete layout for all root forms tiled across (canvasW × canvasH).
function ntmBuildLayout(rootIds, formKids, formFuncs, formFails, nodeMap, canvasW, canvasH) {
  if (!rootIds.length) return [];
  const roots = rootIds.map(id => ({
    id, weight: ntmWeight(id, formKids, formFuncs, formFails),
  }));
  ntmTile(roots, 0, 0, canvasW, canvasH);
  const result = [];
  roots.forEach(r => ntmLayout(r.id, r.x, r.y, r.w, r.h, 0,
    formKids, formFuncs, formFails, nodeMap, result));
  return result;
}

function CascadedTreeMap({ nodes, edges, domainStyling, setEdges }) {
  const containerRef = React.useRef(null);
  const [size, setSize] = React.useState({ w: 800, h: 500 });
  const [dragOver, setDragOver] = React.useState(null);

  // Track container dimensions so the SVG always fills available space.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 20 && height > 20)
        setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.height > 20)
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    return () => obs.disconnect();
  }, []);

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

  const hasUnallocated = unallocated.functions.length > 0 || unallocated.failures.length > 0;
  const trayH = 56;
  const svgH = Math.max(200, size.h - (hasUnallocated ? trayH : 0));

  const layoutItems = React.useMemo(() => {
    const rootForms = formNodes.filter(n => !isChildForm.has(n.id));
    return ntmBuildLayout(
      rootForms.map(n => n.id),
      formKids, formFuncs, formFails, nodeMap,
      size.w, svgH
    );
  }, [formNodes, formKids, formFuncs, formFails, isChildForm, nodeMap, size.w, svgH]);

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

  // Handle drag-over on the SVG by finding the innermost form rect at cursor.
  const handleSvgDragOver = React.useCallback((e) => {
    e.preventDefault();
    const svgEl = e.currentTarget;
    const rect  = svgEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = layoutItems
      .filter(item => item.type === 'form'
        && mx >= item.x && mx <= item.x + item.w
        && my >= item.y && my <= item.y + item.h)
      .sort((a, b) => (a.w * a.h) - (b.w * b.h))[0];
    setDragOver(hit ? hit.id : null);
  }, [layoutItems]);

  const handleSvgDrop = React.useCallback((e) => {
    e.preventDefault();
    if (dragOver) handleDrop(dragOver, e);
    setDragOver(null);
  }, [dragOver, handleDrop]);

  const funcColor = domainStyling?.theme?.functionLayerColor || '#8b5cf6';
  const failColor = domainStyling?.theme?.failureLayerColor  || '#ef4444';

  if (formNodes.length === 0) {
    return (
      <div className="ctmap-wrap">
        <div className="chtree-empty-msg">No form nodes yet. Add nodes from the toolbar above.</div>
      </div>
    );
  }

  return (
    <div className="ctmap-wrap" style={{ overflow: 'hidden' }}>
      {/* Scrollable SVG canvas */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
      >
        <svg
          width={size.w}
          height={svgH}
          style={{ display: 'block' }}
          onDragOver={handleSvgDragOver}
          onDragLeave={() => setDragOver(null)}
          onDrop={handleSvgDrop}
        >
          {layoutItems.map(item => {
            if (item.w < 1 || item.h < 1) return null;
            const showLabel = item.w >= NTM_MIN_LABEL_W && item.h >= NTM_MIN_LABEL_H;
            // Prefix clip-path IDs with node type to guarantee uniqueness across the SVG.
            const clipId = `ntm-clip-${item.type}-${item.id}`;

            if (item.type === 'form') {
              const fill   = dragOver === item.id
                ? '#eef2ff'
                : NTM_FORM_FILL[item.depth % NTM_FORM_FILL.length];
              const stroke = dragOver === item.id
                ? '#6366f1'
                : NTM_FORM_STROKE[item.depth % NTM_FORM_STROKE.length];
              const sw = dragOver === item.id ? 2 : 1;
              const fontSize = Math.max(9, Math.min(12, item.w / 14));
              // Header strip uses 18% opacity overlay of the stroke colour.
              const headerFill = `${stroke}2e`;

              return (
                <g key={item.id}>
                  {/* Background rect */}
                  <rect
                    x={item.x} y={item.y}
                    width={Math.max(0, item.w - 1)}
                    height={Math.max(0, item.h - 1)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    rx={2}
                  />
                  {/* Header colour strip */}
                  <rect
                    x={item.x} y={item.y}
                    width={Math.max(0, item.w - 1)}
                    height={Math.min(NTM_HEADER_H, Math.max(0, item.h - 1))}
                    fill={headerFill}
                    stroke="none"
                    rx={2}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Clip path so the label never overflows the header strip */}
                  {showLabel && (
                    <clipPath id={clipId}>
                      <rect x={item.x + 5} y={item.y} width={Math.max(0, item.w - 10)} height={NTM_HEADER_H} />
                    </clipPath>
                  )}
                  {showLabel && (
                    <text
                      x={item.x + 5}
                      y={item.y + NTM_HEADER_H - 6}
                      fontSize={fontSize}
                      fontWeight={item.depth === 0 ? 700 : 600}
                      fill="#1e293b"
                      clipPath={`url(#${clipId})`}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {item.label}
                    </text>
                  )}
                </g>
              );
            }

            if (item.type === 'function' || item.type === 'failure') {
              const color    = item.type === 'function' ? funcColor : failColor;
              const fontSize = Math.max(8, Math.min(10, item.w / 12));
              // Leaf fill uses 15% opacity of the accent colour.
              const leafFill = `${color}26`;

              return (
                <g key={`${item.type}-${item.id}`}>
                  <rect
                    x={item.x + 1} y={item.y + 1}
                    width={Math.max(0, item.w - 2)}
                    height={Math.max(0, item.h - 2)}
                    fill={leafFill}
                    stroke={color}
                    strokeWidth={1}
                    rx={2}
                  />
                  {showLabel && (
                    <>
                      <clipPath id={clipId}>
                        <rect x={item.x + 4} y={item.y} width={Math.max(0, item.w - 8)} height={item.h} />
                      </clipPath>
                      <text
                        x={item.x + 4}
                        y={item.y + item.h / 2 + fontSize / 2 - 1}
                        fontSize={fontSize}
                        fill={color}
                        clipPath={`url(#${clipId})`}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {item.label}
                      </text>
                    </>
                  )}
                </g>
              );
            }

            return null;
          })}
        </svg>
      </div>

      {/* Unallocated nodes tray */}
      {hasUnallocated && (
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

