import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import GraphEditor from './GraphEditor';
import CandlestickChart from './CandlestickChart';
import './WorkspacePage.css';

// Default algorithm parameters
const getDefaultAlgorithmParams = (algorithmName) => {
  const defaults = {
    fmea_risk_analysis:      { rpn_threshold: 100 },
    flow_balance_analysis:   { tolerance: 0.05 },
    fraud_detection:         { velocity_threshold: 5, amount_multiplier: 3.0 },
    correlation_analysis:    { correlation_threshold: 0.7 },
    portfolio_risk:          {},
    failure_propagation:     { max_depth: 5 },
    anomaly_detection:       {},
    aml_detection:           { structuring_threshold: 10000 },
    risk_scoring:            {},
    dependency_propagation:  { max_depth: 4 },
    critical_components:     { top_n: 5 },
    severity_traceability:   { severity_threshold: 7 },
    dependency_factor:       { top_n: 10 },
  };
  return defaults[algorithmName] || {};
};

// ── SVG icon components ────────────────────────────────────────────────────

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="16" height="16">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="16" height="16">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="16" height="16">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="16" height="16">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="14" height="14">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="13" height="13">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="15" height="15">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ExplorerTabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="13" height="13">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const HierarchyTabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="13" height="13">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

// ── Layer icon components ──────────────────────────────────────────────────

const FormIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="15" height="15">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);

const FunctionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="15" height="15">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
  </svg>
);

const FailureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="15" height="15">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const AllLayersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="15" height="15">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

// Layer definitions (mirrored from GraphEditor for toolbar buttons)
const LAYERS = [
  { id: 'form',     label: 'Form',     title: 'Physical / Logical Structure', shortcut: '1', Icon: FormIcon },
  { id: 'function', label: 'Function', title: 'Behavioral Structure',         shortcut: '2', Icon: FunctionIcon },
  { id: 'failure',  label: 'Failure',  title: 'Risk Structure',               shortcut: '3', Icon: FailureIcon },
];

// ── Hierarchy Explorer ────────────────────────────────────────────

// Build a form-first hierarchy tree from graph nodes + edges
function buildHierarchyTree(graph) {
  const { nodes = [], edges = [] } = graph;
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // Classify edges into hierarchy buckets
  const formChildren = {};     // form → child form ids   (form_hierarchy)
  const formFunctions = {};    // form → function ids     (performs_function)
  const formFailures = {};     // form → failure ids      (has_failure)
  const funcChildren = {};     // function → child func ids (function_flow)
  const failChildren = {};     // failure → child fail ids  (failure_propagation)

  const childFormIds = new Set();
  const linkedFuncIds = new Set();
  const linkedFailIds = new Set();

  edges.forEach(e => {
    const t = e.data?.edgeType;
    const src = e.source, tgt = e.target;
    if (!nodeMap[src] || !nodeMap[tgt]) return;
    if (t === 'form_hierarchy')    { (formChildren[src]  = formChildren[src]  || []).push(tgt); childFormIds.add(tgt); }
    if (t === 'performs_function') { (formFunctions[src] = formFunctions[src] || []).push(tgt); linkedFuncIds.add(tgt); }
    if (t === 'has_failure')       { (formFailures[src]  = formFailures[src]  || []).push(tgt); linkedFailIds.add(tgt); }
    if (t === 'function_flow')     { (funcChildren[src]  = funcChildren[src]  || []).push(tgt); linkedFuncIds.add(tgt); }
    if (t === 'failure_propagation'){ (failChildren[src] = failChildren[src]  || []).push(tgt); linkedFailIds.add(tgt); }
  });

  const rootForms = nodes.filter(n => n.data?.layer === 'form' && !childFormIds.has(n.id));

  const orphanFunctions = nodes.filter(n => n.data?.layer === 'function' && !linkedFuncIds.has(n.id));
  const orphanFailures  = nodes.filter(n => n.data?.layer === 'failure'  && !linkedFailIds.has(n.id));

  return { rootForms, formChildren, formFunctions, formFailures, funcChildren, failChildren, nodeMap, orphanFunctions, orphanFailures };
}

// Edge type rules for hierarchy (mirrors GraphEditor's HIERARCHY_RULES)
const HTREE_EDGE_RULES = [
  { src: 'form',     tgt: 'form',     edgeType: 'form_hierarchy' },
  { src: 'form',     tgt: 'function', edgeType: 'performs_function' },
  { src: 'form',     tgt: 'failure',  edgeType: 'has_failure' },
  { src: 'function', tgt: 'function', edgeType: 'function_flow' },
  { src: 'failure',  tgt: 'failure',  edgeType: 'failure_propagation' },
];

function HierarchyExplorer({ graph, onNodeSelect, selectedNodeId, onNodeRename, onNodeMove }) {
  const [expanded, setExpanded] = useState({});
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [dragOverId, setDragOverId] = useState(null);
  const renameInputRef = React.useRef(null);

  const tree = useMemo(() => buildHierarchyTree(graph), [graph]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id) => expanded[id] !== false; // default open

  const startRename = (e, nodeId, label) => {
    e.stopPropagation();
    setRenamingId(nodeId);
    setRenameVal(label);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = (nodeId) => {
    if (renameVal.trim() && onNodeRename) onNodeRename(nodeId, renameVal.trim());
    setRenamingId(null);
  };

  const handleDragStart = (e, nodeId) => {
    e.dataTransfer.setData('htreeNodeId', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, nodeId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(nodeId);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    const srcId = e.dataTransfer.getData('htreeNodeId');
    if (!srcId || srcId === targetId) return;
    const srcNode = tree.nodeMap[srcId];
    const tgtNode = tree.nodeMap[targetId];
    if (!srcNode || !tgtNode) return;
    const rule = HTREE_EDGE_RULES.find(r => r.src === tgtNode.data?.layer && r.tgt === srcNode.data?.layer);
    if (rule && onNodeMove) onNodeMove(srcId, targetId, rule.edgeType);
  };

  const renderLabel = (nodeId, label, layerClass) => (
    renamingId === nodeId ? (
      <input
        ref={renameInputRef}
        className="htree-rename-input"
        value={renameVal}
        onChange={e => setRenameVal(e.target.value)}
        onBlur={() => commitRename(nodeId)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commitRename(nodeId); }
          if (e.key === 'Escape') setRenamingId(null);
        }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="htree-label"
        onDoubleClick={e => startRename(e, nodeId, label)}
        title="Double-click to rename"
      >{label}</span>
    )
  );

  const renderFunctions = (functionIds, depth) => functionIds.map(functionId => {
    const fn = tree.nodeMap[functionId];
    if (!fn) return null;
    const children = tree.funcChildren[functionId] || [];
    const label = fn.data?.label || functionId;
    return (
      <div key={functionId} className="htree-node" style={{ paddingLeft: 10 + depth * 12 }}>
        <div
          className={`htree-item htree-function${selectedNodeId === functionId ? ' htree-selected' : ''}${dragOverId === functionId ? ' htree-drag-over' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(functionId)}
          draggable
          onDragStart={e => handleDragStart(e, functionId)}
          onDragOver={e => handleDragOver(e, functionId)}
          onDragLeave={() => setDragOverId(null)}
          onDrop={e => handleDrop(e, functionId)}
        >
          {children.length > 0 && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(functionId); }}>
              {isOpen(functionId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">⚙️</span>
          {renderLabel(functionId, label, 'htree-function')}
        </div>
        {children.length > 0 && isOpen(functionId) && renderFunctions(children, depth + 1)}
      </div>
    );
  });

  const renderFailures = (failureIds, depth) => failureIds.map(failureId => {
    const fa = tree.nodeMap[failureId];
    if (!fa) return null;
    const children = tree.failChildren[failureId] || [];
    const label = fa.data?.label || failureId;
    return (
      <div key={failureId} className="htree-node" style={{ paddingLeft: 10 + depth * 12 }}>
        <div
          className={`htree-item htree-failure${selectedNodeId === failureId ? ' htree-selected' : ''}${dragOverId === failureId ? ' htree-drag-over' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(failureId)}
          draggable
          onDragStart={e => handleDragStart(e, failureId)}
          onDragOver={e => handleDragOver(e, failureId)}
          onDragLeave={() => setDragOverId(null)}
          onDrop={e => handleDrop(e, failureId)}
        >
          {children.length > 0 && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(failureId); }}>
              {isOpen(failureId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">⚠️</span>
          {renderLabel(failureId, label, 'htree-failure')}
        </div>
        {children.length > 0 && isOpen(failureId) && renderFailures(children, depth + 1)}
      </div>
    );
  });

  const renderForm = (formId, depth) => {
    const form = tree.nodeMap[formId];
    if (!form) return null;
    const childForms = tree.formChildren[formId] || [];
    const funcs  = tree.formFunctions[formId] || [];
    const fails  = tree.formFailures[formId]  || [];
    const hasChildren = childForms.length > 0 || funcs.length > 0 || fails.length > 0;
    const label = form.data?.label || formId;
    return (
      <div key={formId} className="htree-node" style={{ paddingLeft: depth * 12 }}>
        <div
          className={`htree-item htree-form${selectedNodeId === formId ? ' htree-selected' : ''}${dragOverId === formId ? ' htree-drag-over' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(formId)}
          draggable
          onDragStart={e => handleDragStart(e, formId)}
          onDragOver={e => handleDragOver(e, formId)}
          onDragLeave={() => setDragOverId(null)}
          onDrop={e => handleDrop(e, formId)}
        >
          {hasChildren && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(formId); }}>
              {isOpen(formId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">🔷</span>
          {renderLabel(formId, label, 'htree-form')}
        </div>
        {hasChildren && isOpen(formId) && (
          <>
            {renderFunctions(funcs, depth + 1)}
            {renderFailures(fails, depth + 1)}
            {childForms.map(cid => renderForm(cid, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const isEmpty = tree.rootForms.length === 0 && tree.orphanFunctions.length === 0 && tree.orphanFailures.length === 0;

  return (
    <div className="htree-root">
      {isEmpty && (
        <div className="explorer-empty">No nodes yet.<br/>Add Form nodes and connect them to Functions and Failures.</div>
      )}
      {tree.rootForms.map(f => renderForm(f.id, 0))}
      {tree.orphanFunctions.length > 0 && (
        <div className="htree-orphan-section">
          <div className="htree-orphan-label">Unlinked Functions</div>
          {renderFunctions(tree.orphanFunctions.map(n => n.id), 0)}
        </div>
      )}
      {tree.orphanFailures.length > 0 && (
        <div className="htree-orphan-section">
          <div className="htree-orphan-label">Unlinked Failures</div>
          {renderFailures(tree.orphanFailures.map(n => n.id), 0)}
        </div>
      )}
    </div>
  );
}

// ── Save Modal ────────────────────────────────────────────────────

function SaveModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const nameRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a name'); return; }
    onSave(name.trim(), description.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-save" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Save Diagram</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="modal-body save-form" onSubmit={handleSubmit}>
          <label className="save-field">
            <span>Name *</span>
            <input
              ref={nameRef}
              type="text"
              className={`save-input${error ? ' error' : ''}`}
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. ECU Architecture v1"
              autoComplete="off"
            />
            {error && <span className="save-error">{error}</span>}
          </label>
          <label className="save-field">
            <span>Description</span>
            <input
              type="text"
              className="save-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional"
              autoComplete="off"
            />
          </label>
          <div className="save-actions">
            <button type="button" className="sgraph-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="sgraph-btn sgraph-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function WorkspacePage({ user, onLogout }) {
  const { domain: urlDomain } = useParams();
  const navigate = useNavigate();

  const [, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(urlDomain || null);
  const [domainInfo, setDomainInfo] = useState(null);
  const [domainStyling, setDomainStyling] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [algorithmResults, setAlgorithmResults] = useState(null);
  const [algorithmLog, setAlgorithmLog] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showCandlestick, setShowCandlestick] = useState(false);
  const consoleOutputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Layer state (lifted from GraphEditor)
  const [activeLayer, setActiveLayer] = useState('form');

  // Track whether we are editing a previously-saved diagram
  const [currentGraphId, setCurrentGraphId] = useState(null);
  const [currentGraphName, setCurrentGraphName] = useState('');

  // Sidebar file-explorer: list of all saved graphs
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [explorerOpen, setExplorerOpen] = useState(true);

  // Sidebar tab: 'explorer' | 'hierarchy'
  const [sidebarTab, setSidebarTab] = useState('hierarchy');

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const sidebarDragRef = React.useRef({ dragging: false, startX: 0, startW: 0 });
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault();
    sidebarDragRef.current = { dragging: true, startX: e.clientX, startW: sidebarWidth };
    const onMove = (ev) => {
      if (!sidebarDragRef.current.dragging) return;
      const delta = ev.clientX - sidebarDragRef.current.startX;
      setSidebarWidth(Math.max(150, Math.min(480, sidebarDragRef.current.startW + delta)));
    };
    const onUp = () => {
      sidebarDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  // File explorer inline rename
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameFileVal, setRenameFileVal] = useState('');
  const renameFileInputRef = React.useRef(null);

  // File explorer drag-and-drop reorder
  const [draggedFileId, setDraggedFileId] = useState(null);

  // Hierarchy selected node
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Algorithm selection for toolbar-middle
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [algorithmParams, setAlgorithmParams] = useState({});

  const loadDomains = useCallback(async () => {
    try {
      const data = await domainsAPI.getDomains();
      // Optionally filter by REACT_APP_ENABLED_DOMAINS (build-time domain isolation).
      // Set REACT_APP_ENABLED_DOMAINS=automotive in .env for an automotive-only build.
      const envFilter = process.env.REACT_APP_ENABLED_DOMAINS;
      const allowed = envFilter
        ? new Set(envFilter.split(',').map(d => d.trim()).filter(Boolean))
        : null;
      const filtered = allowed ? data.filter(d => allowed.has(d.name)) : data;
      setDomains(filtered);
      if (!selectedDomain && filtered.length > 0) {
        setSelectedDomain(filtered[0].name);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedGraphs = useCallback(async () => {
    try {
      const data = await domainsAPI.listGraphs(null);
      setSavedGraphs(data);
    } catch (err) {
      console.error('Failed to load saved graphs:', err);
    }
  }, []);

  useEffect(() => { loadDomains(); }, [loadDomains]);
  useEffect(() => { loadSavedGraphs(); }, [loadSavedGraphs]);

  // Scroll console output to bottom whenever new log entries are added.
  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [algorithmLog.length]);

  useEffect(() => {
    if (selectedDomain) {
      loadDomainInfo(selectedDomain);
      loadDomainStyling(selectedDomain);
    }
  }, [selectedDomain]);

  const loadDomainInfo = async (domain) => {
    try {
      const info = await domainsAPI.getDomainInfo(domain);
      setDomainInfo(info);
    } catch (error) {
      console.error('Failed to load domain info:', error);
    }
  };

  const loadDomainStyling = async (domain) => {
    try {
      const styling = await domainsAPI.getDomainStyling(domain);
      setDomainStyling(styling);
    } catch (error) {
      console.error('Failed to load styling:', error);
    }
  };

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    navigate(`/workspace/${domain}`);
    setGraph({ nodes: [], edges: [] });
    setAlgorithmResults(null);
    setSaveStatus('');
    setCurrentGraphId(null);
    setCurrentGraphName('');
    setSelectedAlgorithm(null);
    setAlgorithmParams({});
  };

  const handleRunAlgorithm = async (algorithmName, params) => {
    const getTimestamp = () => new Date().toLocaleTimeString();
    setLoading(true);
    setShowConsole(true);

    // ── Special case: Validate Diagram ────────────────────────────────────
    if (algorithmName === 'validate_diagram') {
      setAlgorithmLog(prev => [
        ...prev,
        { type: 'info', message: '▶ Running: Validate Diagram', time: getTimestamp() },
      ]);
      try {
        const result = await domainsAPI.validateDiagram(selectedDomain, graph);
        const statusIcon = { pass: '✓', warn: '⚠', info: 'ℹ', error: '✗' };
        const logType   = { pass: 'success', warn: 'warn', info: 'info', error: 'error' };
        setAlgorithmLog(prev => [
          ...prev,
          {
            type: result.valid ? 'success' : 'warn',
            message: result.summary,
            time: getTimestamp(),
          },
          { type: 'info', message: `  Forms: ${result.stats?.forms ?? 0}  Functions: ${result.stats?.functions ?? 0}  Failures: ${result.stats?.failures ?? 0}  Edges: ${result.stats?.edges ?? 0}`, time: getTimestamp() },
          ...(result.checks || []).flatMap(c => [
            {
              type: logType[c.status] || 'info',
              message: `  ${statusIcon[c.status] || ' '} [${c.check}] ${c.message}`,
              time: getTimestamp(),
            },
            ...(c.items && c.items.length > 0
              ? [{ type: 'result', message: `      → ${c.items.slice(0, 5).join(', ')}${c.items.length > 5 ? ` … +${c.items.length - 5} more` : ''}`, time: getTimestamp() }]
              : []),
          ]),
        ]);
      } catch (error) {
        setAlgorithmLog(prev => [
          ...prev,
          { type: 'error', message: `✗ Validation error: ${error.message || 'Failed to validate diagram.'}`, time: getTimestamp() },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── All other algorithms: auto-validate first, then run ────────────────
    setAlgorithmLog(prev => [
      ...prev,
      { type: 'info', message: `▶ Running: ${algorithmName.replace(/_/g, ' ')}`, time: getTimestamp() },
      ...(Object.keys(params).length > 0
        ? [{ type: 'info', message: `  Params: ${JSON.stringify(params)}`, time: getTimestamp() }]
        : []),
    ]);

    // Step 1: Validate diagram before executing graph algorithm
    try {
      const validation = await domainsAPI.validateDiagram(selectedDomain, graph);
      if (!validation.valid) {
        setAlgorithmLog(prev => [
          ...prev,
          { type: 'warn', message: `⚠ Pre-run validation: ${validation.summary}`, time: getTimestamp() },
          ...(validation.checks || [])
            .filter(c => c.status === 'error' || c.status === 'warn')
            .map(c => ({
              type: c.status === 'error' ? 'error' : 'warn',
              message: `  ⚠ [${c.check}] ${c.message}`,
              time: getTimestamp(),
            })),
          { type: 'error', message: '✗ Algorithm aborted — fix validation errors above and retry.', time: getTimestamp() },
        ]);
        setLoading(false);
        return;
      }
      if (validation.checks && validation.checks.some(c => c.status === 'warn')) {
        setAlgorithmLog(prev => [
          ...prev,
          { type: 'warn', message: `⚠ Pre-run validation: ${validation.summary}`, time: getTimestamp() },
        ]);
      }
    } catch {
      // If validation endpoint is unavailable, proceed anyway
    }

    // Step 2: Run the selected algorithm
    try {
      const result = await domainsAPI.runAlgorithm(selectedDomain, algorithmName, graph, params);
      if (result.success) {
        setAlgorithmResults(result.results);
        if (result.updated_graph) setGraph(result.updated_graph);
        const entries = result.results ? Object.entries(result.results) : [];
        setAlgorithmLog(prev => [
          ...prev,
          { type: 'success', message: `✓ Completed: ${algorithmName.replace(/_/g, ' ')}`, time: getTimestamp() },
          ...entries.map(([k, v]) => ({
            type: 'result',
            message: `  ${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`,
            time: getTimestamp(),
          })),
        ]);
      } else {
        setAlgorithmLog(prev => [
          ...prev,
          { type: 'error', message: `✗ Failed: ${result.error || 'Unknown error'}`, time: getTimestamp() },
        ]);
      }
    } catch (error) {
      console.error('Algorithm error:', error);
      setAlgorithmLog(prev => [
        ...prev,
        { type: 'error', message: `✗ Error: ${error.message || 'Failed to run algorithm.'}`, time: getTimestamp() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearGraph = () => {
    if (window.confirm('Clear all nodes and edges?')) {
      setGraph({ nodes: [], edges: [] });
      setAlgorithmResults(null);
      setSaveStatus('');
      setCurrentGraphId(null);
      setCurrentGraphName('');
    }
  };

  // Smart save: overwrite existing file, or open modal for new diagrams
  const handleSaveGraph = async () => {
    if (graph.nodes.length === 0) { alert('Cannot save an empty graph'); return; }
    if (currentGraphId) {
      // Overwrite the existing saved diagram directly — no dialog needed
      setLoading(true);
      setSaveStatus('Saving…');
      try {
        const result = await domainsAPI.updateGraph(currentGraphId, graph);
        if (result.success) {
          setSaveStatus(`Saved: ${result.name}`);
          loadSavedGraphs();
          setTimeout(() => setSaveStatus(''), 3000);
        } else {
          setSaveStatus('Save failed');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus('Save failed');
        setTimeout(() => setSaveStatus(''), 3000);
      } finally {
        setLoading(false);
      }
    } else {
      // New unsaved diagram — ask for a name
      setSaveModalOpen(true);
    }
  };

  const handleSaveConfirm = async (name, description) => {
    setLoading(true);
    setSaveStatus('Saving…');
    try {
      const result = await domainsAPI.saveGraph(name, description, graph, selectedDomain);
      if (result.success) {
        setSaveStatus(`Saved: ${result.name}`);
        setCurrentGraphId(result.graph_id);
        setCurrentGraphName(result.name);
        loadSavedGraphs();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Save failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGraph = async (format = 'json') => {
    if (graph.nodes.length === 0) { alert('Cannot export an empty graph'); return; }
    try {
      const result = await domainsAPI.exportGraph(graph, format);
      if (result.success && format === 'json') {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-${selectedDomain}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setSaveStatus('Exported');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export graph.');
    }
  };

  const handleImportGraph = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedGraph = JSON.parse(event.target.result);
          if (importedGraph.nodes && importedGraph.edges) {
            setGraph(importedGraph);
            // Imported from file — treat as unsaved (no currentGraphId)
            setCurrentGraphId(null);
            setCurrentGraphName('');
            setSaveStatus('Imported');
            setTimeout(() => setSaveStatus(''), 3000);
          } else {
            alert('Invalid graph file format');
          }
        } catch (error) {
          alert('Failed to import graph. Invalid JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadGraphById = async (graphId) => {
    try {
      const result = await domainsAPI.loadGraph(graphId);
      if (result.success) {
        const rec = result.graph;
        if (rec.domain !== selectedDomain) {
          handleDomainChange(rec.domain);
        }
        setGraph(rec.graph_data);
        setCurrentGraphId(rec.id);
        setCurrentGraphName(rec.name);
        setSaveStatus(`Loaded: ${rec.name}`);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error('Failed to load graph:', err);
      alert('Failed to load diagram.');
    }
  };

  const handleDeleteGraph = async (graphId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await domainsAPI.deleteGraph(graphId);
      setSavedGraphs(prev => prev.filter(g => g.id !== graphId));
      if (currentGraphId === graphId) {
        setCurrentGraphId(null);
        setCurrentGraphName('');
      }
    } catch {
      alert('Failed to delete diagram.');
    }
  };

  const domainIcons = {
    automotive: '🚗',
    process_plant: '⚙️',
    financial: '💰',
    trading: '📈'
  };

  // ── File rename handlers ──────────────────────────────────────────
  const handleRenameFileStart = useCallback((g, e) => {
    e.stopPropagation();
    setRenamingFileId(g.id);
    setRenameFileVal(g.name);
    setTimeout(() => renameFileInputRef.current?.select(), 0);
  }, []);

  const handleRenameFileConfirm = useCallback(async (graphId) => {
    const newName = renameFileVal.trim();
    setRenamingFileId(null);
    if (!newName) return;
    try {
      await domainsAPI.updateGraph(graphId, graph, newName);
      setSavedGraphs(prev => prev.map(g => g.id === graphId ? { ...g, name: newName } : g));
      if (currentGraphId === graphId) setCurrentGraphName(newName);
    } catch (err) {
      console.error('Failed to rename diagram:', err);
    }
  }, [renameFileVal, graph, currentGraphId]);

  // ── Hierarchy node rename/move handlers ──────────────────────────
  const handleNodeRename = useCallback((nodeId, newLabel) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n),
    }));
  }, []);

  const handleNodeMove = useCallback((srcId, newParentId, edgeType) => {
    setGraph(prev => {
      // Remove all existing edges of this edgeType pointing to srcId.
      // Each node has at most one parent per edge type in the hierarchy (tree constraint),
      // so this correctly re-parents the node by replacing its single parent edge.
      const filteredEdges = prev.edges.filter(e => !(e.target === srcId && e.data?.edgeType === edgeType));
      const newEdge = {
        id: `edge-move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: newParentId,
        target: srcId,
        type: 'default',
        data: { edgeType },
        markerEnd: { type: 'arrowclosed' },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      };
      return { ...prev, edges: [...filteredEdges, newEdge] };
    });
  }, []);

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-header-icon" title="Dashboard">
            <HomeIcon />
          </button>
          <span className="app-title">SafetyMindPro</span>
        </div>
        <div className="workspace-header-right">
          <span className="user-name">{user?.username}</span>
          <button onClick={onLogout} className="btn-header-icon" title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <div className="workspace-container">
        {/* ── File-explorer sidebar (VS Code style) ── */}
        <aside className="workspace-sidebar" style={{ width: sidebarWidth }}>
          <div className="explorer-header">
            <button
              className={`explorer-tab-btn${sidebarTab === 'explorer' ? ' active' : ''}`}
              onClick={() => setSidebarTab('explorer')}
              title="Explorer"
            >
              <span className="explorer-tab-icon"><ExplorerTabIcon /></span>
              FILES
            </button>
            <button
              className={`explorer-tab-btn${sidebarTab === 'hierarchy' ? ' active' : ''}`}
              onClick={() => setSidebarTab('hierarchy')}
              title="Hierarchy"
            >
              <span className="explorer-tab-icon"><HierarchyTabIcon /></span>
              TREE
            </button>
          </div>

          {sidebarTab === 'explorer' && (
            <>
              <div className="explorer-section">
                <button
                  className="explorer-section-title"
                  onClick={() => setExplorerOpen(o => !o)}
                  aria-expanded={explorerOpen}
                >
                  <span className={`explorer-chevron ${explorerOpen ? 'open' : ''}`}>▸</span>
                  SAVED DIAGRAMS
                </button>
                {explorerOpen && (
                  <div className="explorer-files">
                    {savedGraphs.length === 0 && (
                      <div className="explorer-empty">No saved diagrams</div>
                    )}
                    {savedGraphs.map(g => (
                      <div
                        key={g.id}
                        className={`explorer-file${currentGraphId === g.id ? ' active' : ''}${draggedFileId === g.id ? ' dragging' : ''}`}
                        onClick={() => renamingFileId !== g.id && handleLoadGraphById(g.id)}
                        title={`${g.name} · ${g.domain} · ${g.node_count}N ${g.edge_count}E`}
                        draggable
                        onDragStart={() => setDraggedFileId(g.id)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (!draggedFileId || draggedFileId === g.id) return;
                          setSavedGraphs(prev => {
                            const src = prev.findIndex(x => x.id === draggedFileId);
                            const tgt = prev.findIndex(x => x.id === g.id);
                            const result = [...prev];
                            const [removed] = result.splice(src, 1);
                            result.splice(tgt, 0, removed);
                            return result;
                          });
                          setDraggedFileId(null);
                        }}
                        onDragEnd={() => setDraggedFileId(null)}
                      >
                        <FileIcon />
                        {renamingFileId === g.id ? (
                          <input
                            ref={renameFileInputRef}
                            className="explorer-file-rename"
                            value={renameFileVal}
                            onChange={e => setRenameFileVal(e.target.value)}
                            onBlur={() => handleRenameFileConfirm(g.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleRenameFileConfirm(g.id); }
                              if (e.key === 'Escape') setRenamingFileId(null);
                            }}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="explorer-file-name"
                            onDoubleClick={e => handleRenameFileStart(g, e)}
                            title="Double-click to rename"
                          >{g.name}</span>
                        )}
                        <span className="explorer-file-domain">{domainIcons[g.domain] || g.domain}</span>
                        <button
                          className="explorer-file-delete"
                          onClick={e => { e.stopPropagation(); handleDeleteGraph(g.id, g.name); }}
                          title="Delete"
                          aria-label={`Delete ${g.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Algorithm results shown below the file list */}
              {algorithmResults && (
                <div className="explorer-results">
                  <div className="explorer-section-title explorer-section-title--static">
                    ANALYSIS RESULTS
                  </div>
                  <div className="explorer-results-body">
                    {Object.entries(algorithmResults).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="result-row">
                        <span className="result-key">{k.replace(/_/g, ' ')}</span>
                        <span className="result-val">
                          {typeof v === 'object'
                            ? (() => { const s = JSON.stringify(v); return s.length > 40 ? s.slice(0, 40) + '…' : s; })()
                            : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {sidebarTab === 'hierarchy' && (
            <HierarchyExplorer
              graph={graph}
              onNodeSelect={setSelectedNodeId}
              selectedNodeId={selectedNodeId}
              onNodeRename={handleNodeRename}
              onNodeMove={handleNodeMove}
            />
          )}
        </aside>

        <div className="sidebar-resize-handle" onMouseDown={handleSidebarResizeStart} title="Drag to resize sidebar" />

        <main className="workspace-main">
          <div className="workspace-toolbar">
            {/* ── Layer tab buttons (replaced the old domain-badge/stats) ── */}
            <div className="toolbar-left">
              {LAYERS.map(layer => (
                <button
                  key={layer.id}
                  className={`layer-btn layer-btn-${layer.id}${activeLayer === layer.id ? ' active' : ''}`}
                  onClick={() => setActiveLayer(layer.id)}
                  title={`${layer.label}: ${layer.title} (Alt+${layer.shortcut})`}
                >
                  <layer.Icon />
                </button>
              ))}
              <button
                className={`layer-btn layer-btn-all${activeLayer === 'all' ? ' active' : ''}`}
                onClick={() => setActiveLayer('all')}
                title="All Layers: Show Forms, Functions and Failures"
              >
                <AllLayersIcon />
              </button>
              {saveStatus && <span className="save-status">{saveStatus}</span>}
            </div>

            {/* ── Algorithm selector + Run (moved from sidebar) ── */}
            <div className="toolbar-middle">
              {domainInfo && (
                <>
                  <select
                    className="algo-select"
                    value={selectedAlgorithm?.name || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'validate_diagram') {
                        setSelectedAlgorithm({ name: 'validate_diagram', description: 'Validate diagram connectivity and allocation' });
                        setAlgorithmParams({});
                      } else {
                        const algo = domainInfo.algorithms?.find(a => a.name === val);
                        setSelectedAlgorithm(algo || null);
                        setAlgorithmParams(getDefaultAlgorithmParams(val));
                      }
                    }}
                    aria-label="Algorithm"
                  >
                    <option value="">Algorithm…</option>
                    <option value="validate_diagram">✔ Validate Diagram</option>
                    {(domainInfo.algorithms || []).map(a => (
                      <option key={a.name} value={a.name}>
                        {a.name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>

                  {selectedAlgorithm && selectedAlgorithm.name !== 'validate_diagram' && Object.entries(algorithmParams).map(([key, val]) => (
                    <div key={key} className="algo-param">
                      <label className="algo-param-label">{key.replace(/_/g, ' ')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        onChange={e => setAlgorithmParams(prev => ({
                          ...prev,
                          [key]: e.target.value === '' ? '' : (isNaN(parseFloat(e.target.value)) ? e.target.value : parseFloat(e.target.value)),
                        }))}
                        className="algo-param-input"
                        aria-label={key}
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => selectedAlgorithm && handleRunAlgorithm(selectedAlgorithm.name, algorithmParams)}
                    className="icon-btn btn-run-algo"
                    disabled={loading || !selectedAlgorithm}
                    title={selectedAlgorithm ? `Run ${selectedAlgorithm.name.replace(/_/g, ' ')}` : 'Select an algorithm first'}
                  >
                    {loading ? '⏳' : '▶'}
                  </button>

                  <button
                    onClick={() => { setShowConsole(c => !c); setShowCandlestick(false); }}
                    className={`icon-btn btn-console-toggle${showConsole ? ' active' : ''}`}
                    title={showConsole ? 'Switch to canvas view' : 'Switch to console view'}
                  >
                    {'>_'}
                  </button>

                  {(selectedDomain === 'trading' || selectedDomain === 'financial') && (
                    <button
                      onClick={() => { setShowCandlestick(c => !c); setShowConsole(false); }}
                      className={`icon-btn btn-candlestick-toggle${showCandlestick ? ' active' : ''}`}
                      title={showCandlestick ? 'Switch to canvas view' : 'Depot Candlestick Chart'}
                    >
                      📈
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── File action buttons ── */}
            <div className="toolbar-actions">
              <button
                onClick={handleSaveGraph}
                className="icon-btn icon-btn-save"
                disabled={loading}
                title={currentGraphId ? `Save (overwrite "${currentGraphName}")` : 'Save as new diagram'}
              >
                <SaveIcon />
              </button>
              <button
                onClick={() => handleExportGraph('json')}
                className="icon-btn icon-btn-export"
                disabled={loading}
                title="Export as JSON"
              >
                <ExportIcon />
              </button>
              <button
                onClick={handleImportGraph}
                className="icon-btn icon-btn-import"
                disabled={loading}
                title="Import from JSON"
              >
                <ImportIcon />
              </button>
              <button
                onClick={handleClearGraph}
                className="icon-btn icon-btn-danger"
                title="Clear canvas"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          {showConsole ? (
            <div className="console-panel">
              <div className="console-output" ref={consoleOutputRef}>
                {algorithmLog.length === 0 && (
                  <span className="console-empty">Run an algorithm to see output here.</span>
                )}
                {algorithmLog.map((entry, i) => (
                  <div key={i} className={`console-line console-line-${entry.type}`}>
                    <span className="console-time">{entry.time}</span>
                    <span className="console-msg">{entry.message}</span>
                  </div>
                ))}
              </div>
              <div className="console-footer">
                <button className="console-clear-btn" onClick={() => setAlgorithmLog([])}>Clear</button>
              </div>
            </div>
          ) : showCandlestick ? (
            <CandlestickChart domain={selectedDomain} />
          ) : domainInfo ? (
            <GraphEditor
              graph={graph}
              domainInfo={domainInfo}
              domainStyling={domainStyling}
              onGraphChange={setGraph}
              activeLayer={activeLayer}
              onLayerChange={setActiveLayer}
            />
          ) : (
            <div className="workspace-loading">
              <div className="spinner" />
              <p>Loading workspace…</p>
            </div>
          )}
        </main>
      </div>

      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveConfirm}
      />
    </div>
  );
}

export default WorkspacePage;
