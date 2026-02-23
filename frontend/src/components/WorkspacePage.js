import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import GraphEditor from './GraphEditor';
import './WorkspacePage.css';

// Layer definitions (mirrored from GraphEditor for toolbar buttons)
const LAYERS = [
  { id: 'form',     label: 'Form',     title: 'Physical / Logical Structure', shortcut: '1' },
  { id: 'function', label: 'Function', title: 'Behavioral Structure',         shortcut: '2' },
  { id: 'failure',  label: 'Failure',  title: 'Risk Structure',               shortcut: '3' },
];

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

  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(urlDomain || null);
  const [domainInfo, setDomainInfo] = useState(null);
  const [domainStyling, setDomainStyling] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [algorithmResults, setAlgorithmResults] = useState(null);
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
  const [sidebarTab, setSidebarTab] = useState('explorer');

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
      setDomains(data);
      if (!selectedDomain && data.length > 0) {
        setSelectedDomain(data[0].name);
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
    setLoading(true);
    try {
      const result = await domainsAPI.runAlgorithm(selectedDomain, algorithmName, graph, params);
      if (result.success) {
        setAlgorithmResults(result.results);
        if (result.updated_graph) setGraph(result.updated_graph);
      } else {
        alert(`Algorithm failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Algorithm error:', error);
      alert('Failed to run algorithm.');
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
        <div className="workspace-header-center">
          {domains.map((d) => (
            <button
              key={d.name}
              className="domain-tab"
              onClick={() => handleDomainChange(d.name)}
              title={d.display_name}
            >
              <span className="domain-tab-icon">{domainIcons[d.name]}</span>
              <span className="domain-tab-text">{d.display_name}</span>
            </button>
          ))}
        </div>
        <div className="workspace-header-right">
          <span className="user-name">{user?.username}</span>
          <button onClick={onLogout} className="btn-icon-text" title="Logout">
            <LogoutIcon /> Logout
          </button>
        </div>
      </header>

      <div className="workspace-container">
        {/* ── File-explorer sidebar (VS Code style) ── */}
        <aside className="workspace-sidebar">
          <div className="explorer-header">
            <button
              className={`explorer-tab-btn${sidebarTab === 'explorer' ? ' active' : ''}`}
              onClick={() => setSidebarTab('explorer')}
            >EXPLORER</button>
            <button
              className={`explorer-tab-btn${sidebarTab === 'hierarchy' ? ' active' : ''}`}
              onClick={() => setSidebarTab('hierarchy')}
            >HIERARCHY</button>
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

        <main className="workspace-main">
          <div className="workspace-toolbar">
            {/* ── Layer tab buttons (replaced the old domain-badge/stats) ── */}
            <div className="toolbar-left">
              {LAYERS.map(layer => (
                <button
                  key={layer.id}
                  className={`layer-btn layer-btn-${layer.id}${activeLayer === layer.id ? ' active' : ''}`}
                  onClick={() => setActiveLayer(layer.id)}
                  title={`${layer.title} (Alt+${layer.shortcut})`}
                >
                  {layer.label}
                </button>
              ))}
              {saveStatus && <span className="save-status">{saveStatus}</span>}
            </div>

            {/* ── Algorithm selector + Run (moved from sidebar) ── */}
            <div className="toolbar-middle">
              {domainInfo?.algorithms && domainInfo.algorithms.length > 0 && (
                <>
                  <select
                    className="algo-select"
                    value={selectedAlgorithm?.name || ''}
                    onChange={e => {
                      const algo = domainInfo.algorithms.find(a => a.name === e.target.value);
                      setSelectedAlgorithm(algo || null);
                      setAlgorithmParams(getDefaultAlgorithmParams(e.target.value));
                    }}
                    aria-label="Algorithm"
                  >
                    <option value="">Algorithm…</option>
                    {domainInfo.algorithms.map(a => (
                      <option key={a.name} value={a.name}>
                        {a.name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>

                  {selectedAlgorithm && Object.entries(algorithmParams).map(([key, val]) => (
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

          {domainInfo ? (
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
