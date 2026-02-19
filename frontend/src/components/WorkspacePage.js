import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import GraphEditor from './GraphEditor';
import AlgorithmPanel from './AlgorithmPanel';
import ResultsPanel from './ResultsPanel';
import './WorkspacePage.css';

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

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="16" height="16">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
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

// ── Saved Diagrams Modal ───────────────────────────────────────────────────

function SavedDiagramsModal({ isOpen, onClose, onLoad, selectedDomain }) {
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchGraphs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await domainsAPI.listGraphs(selectedDomain || null);
      setGraphs(data);
    } catch (err) {
      setError('Failed to load saved diagrams.');
    } finally {
      setLoading(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (isOpen) fetchGraphs();
  }, [isOpen, fetchGraphs]);

  const handleDelete = async (graphId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await domainsAPI.deleteGraph(graphId);
      setGraphs(prev => prev.filter(g => g.id !== graphId));
    } catch {
      setError('Failed to delete diagram.');
    }
  };

  const handleLoad = async (graphId) => {
    try {
      const result = await domainsAPI.loadGraph(graphId);
      if (result.success) {
        onLoad(result.graph);
        onClose();
      }
    } catch {
      setError('Failed to load diagram.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Saved Diagrams</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="modal-loading">Loading…</div>}
          {error && <div className="modal-error">{error}</div>}
          {!loading && graphs.length === 0 && !error && (
            <div className="modal-empty">No saved diagrams yet.</div>
          )}
          {graphs.map(g => (
            <div key={g.id} className="saved-graph-row">
              <div className="saved-graph-info">
                <span className="saved-graph-name">{g.name}</span>
                <span className="saved-graph-meta">
                  {g.domain} · {g.node_count}N · {g.edge_count}E ·{' '}
                  {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="saved-graph-actions">
                <button
                  className="sgraph-btn sgraph-load"
                  onClick={() => handleLoad(g.id)}
                  title="Load diagram"
                >
                  Load
                </button>
                <button
                  className="sgraph-btn sgraph-delete"
                  onClick={() => handleDelete(g.id, g.name)}
                  title="Delete diagram"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

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

  useEffect(() => { loadDomains(); }, [loadDomains]);

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
    }
  };

  const handleSaveGraph = async () => {
    if (graph.nodes.length === 0) { alert('Cannot save an empty graph'); return; }
    setSaveModalOpen(true);
  };

  const handleSaveConfirm = async (name, description) => {
    setLoading(true);
    setSaveStatus('Saving…');
    try {
      const result = await domainsAPI.saveGraph(name, description, graph, selectedDomain);
      if (result.success) {
        setSaveStatus(`Saved: ${result.name}`);
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

  const handleLoadSavedGraph = (graphRecord) => {
    if (graphRecord.domain !== selectedDomain) {
      handleDomainChange(graphRecord.domain);
    }
    setGraph(graphRecord.graph_data);
    setSaveStatus(`Loaded: ${graphRecord.name}`);
    setTimeout(() => setSaveStatus(''), 3000);
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
        <aside className="workspace-sidebar">
          {domainInfo && (
            <AlgorithmPanel
              domainInfo={domainInfo}
              onRunAlgorithm={handleRunAlgorithm}
              loading={loading}
            />
          )}
          {algorithmResults && (
            <ResultsPanel
              results={algorithmResults}
              domainName={selectedDomain}
            />
          )}
        </aside>

        <main className="workspace-main">
          <div className="workspace-toolbar">
            <div className="toolbar-left">
              {domainInfo && (
                <span className="domain-badge">
                  {domainIcons[selectedDomain]} {domainInfo?.display_name}
                </span>
              )}
              <span className="graph-stats">
                {graph.nodes.length}N · {graph.edges.length}E
              </span>
              {saveStatus && <span className="save-status">{saveStatus}</span>}
            </div>
            <div className="toolbar-actions">
              <button
                onClick={handleSaveGraph}
                className="icon-btn icon-btn-save"
                disabled={loading}
                title="Save diagram"
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
                onClick={() => setSavedModalOpen(true)}
                className="icon-btn icon-btn-folder"
                title="Open saved diagrams"
              >
                <FolderIcon />
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
            />
          ) : (
            <div className="workspace-loading">
              <div className="spinner" />
              <p>Loading workspace…</p>
            </div>
          )}
        </main>
      </div>

      <SavedDiagramsModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        onLoad={handleLoadSavedGraph}
        selectedDomain={selectedDomain}
      />
      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveConfirm}
      />
    </div>
  );
}

export default WorkspacePage;

