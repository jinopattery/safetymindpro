import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import GraphEditor from './GraphEditor';
import './WorkspacePage.css';

// Layer definitions (mirrored from GraphEditor for toolbar buttons)
const LAYERS = [
  { id: 'form',     label: 'Structure', title: 'Physical / Logical Structure', shortcut: '1' },
  { id: 'function', label: 'Behavior',  title: 'Behavioral Structure',         shortcut: '2' },
  { id: 'failure',  label: 'Risk',      title: 'Risk Structure',               shortcut: '3' },
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

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="14" height="14">
    <polyline points="15 18 9 12 15 6"/>
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

function HierarchyExplorer({ graph, onNodeSelect, selectedNodeId }) {
  const [expanded, setExpanded] = useState({});
  const [panelOpen, setPanelOpen] = useState(true);

  const tree = useMemo(() => buildHierarchyTree(graph), [graph]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id) => expanded[id] !== false; // default open

  const renderFunctions = (functionIds, depth) => functionIds.map(functionId => {
    const fn = tree.nodeMap[functionId];
    if (!fn) return null;
    const children = tree.funcChildren[functionId] || [];
    const label = fn.data?.label || functionId;
    return (
      <div key={functionId} className="htree-node" style={{ paddingLeft: 10 + depth * 12 }}>
        <div
          className={`htree-item htree-function${selectedNodeId === functionId ? ' htree-selected' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(functionId)}
        >
          {children.length > 0 && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(functionId); }}>
              {isOpen(functionId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">⚙️</span>
          <span className="htree-label">{label}</span>
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
          className={`htree-item htree-failure${selectedNodeId === failureId ? ' htree-selected' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(failureId)}
        >
          {children.length > 0 && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(failureId); }}>
              {isOpen(failureId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">⚠️</span>
          <span className="htree-label">{label}</span>
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
          className={`htree-item htree-form${selectedNodeId === formId ? ' htree-selected' : ''}`}
          onClick={() => onNodeSelect && onNodeSelect(formId)}
        >
          {hasChildren && (
            <button className="htree-toggle" onClick={e => { e.stopPropagation(); toggle(formId); }}>
              {isOpen(formId) ? '▾' : '▸'}
            </button>
          )}
          <span className="htree-icon">🔷</span>
          <span className="htree-label">{label}</span>
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
    <aside className="workspace-hierarchy">
      <div className="explorer-header">HIERARCHY</div>
      <div className="explorer-section">
        <button
          className="explorer-section-title"
          onClick={() => setPanelOpen(o => !o)}
          aria-expanded={panelOpen}
        >
          <span className={`explorer-chevron ${panelOpen ? 'open' : ''}`}>▸</span>
          FORM · FUNCTION · FAILURE
        </button>
        {panelOpen && (
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
        )}
      </div>
    </aside>
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

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-icon-text" title="Back to Dashboard">
            <BackIcon /> Dashboard
          </button>
          <span className="app-title">SafetyMindPro</span>
        </div>
        <div className="workspace-header-center">
          {domains.map((d) => (
            <button
              key={d.name}
              className={`domain-tab ${selectedDomain === d.name ? 'active' : ''}`}
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
          <div className="explorer-header">EXPLORER</div>
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
                    className={`explorer-file${currentGraphId === g.id ? ' active' : ''}`}
                    onClick={() => handleLoadGraphById(g.id)}
                    title={`${g.name} · ${g.domain} · ${g.node_count}N ${g.edge_count}E`}
                  >
                    <FileIcon />
                    <span className="explorer-file-name">{g.name}</span>
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
        </aside>

        {/* ── Hierarchy explorer sidebar ── */}
        <HierarchyExplorer graph={graph} />

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
