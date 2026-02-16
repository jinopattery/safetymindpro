import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import GraphEditor from './GraphEditor';
import AlgorithmPanel from './AlgorithmPanel';
import ResultsPanel from './ResultsPanel';
import './WorkspacePage.css';

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
  }, [selectedDomain]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

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
      const result = await domainsAPI.runAlgorithm(
        selectedDomain,
        algorithmName,
        graph,
        params
      );
      
      if (result.success) {
        setAlgorithmResults(result.results);
        if (result.updated_graph) {
          setGraph(result.updated_graph);
        }
      } else {
        alert(`Algorithm failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Algorithm error:', error);
      alert('Failed to run algorithm. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearGraph = () => {
    if (window.confirm('Clear all nodes and edges? This action cannot be undone.')) {
      setGraph({ nodes: [], edges: [] });
      setAlgorithmResults(null);
      setSaveStatus('');
    }
  };

  const handleSaveGraph = async () => {
    if (graph.nodes.length === 0) {
      alert('Cannot save an empty graph');
      return;
    }

    const name = prompt('Enter a name for this graph:');
    if (!name) return;

    const description = prompt('Enter a description (optional):');

    setLoading(true);
    setSaveStatus('Saving...');
    
    try {
      const result = await domainsAPI.saveGraph(name, description, graph, selectedDomain);
      
      if (result.success) {
        setSaveStatus(`✓ Saved: ${result.name}`);
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('✗ Save failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('✗ Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGraph = async (format = 'json') => {
    if (graph.nodes.length === 0) {
      alert('Cannot export an empty graph');
      return;
    }

    try {
      const result = await domainsAPI.exportGraph(graph, format);
      
      if (result.success && format === 'json') {
        // Download JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-${selectedDomain}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        setSaveStatus('✓ Exported');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export graph. Check console for details.');
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
            setSaveStatus('✓ Imported');
            setTimeout(() => setSaveStatus(''), 3000);
          } else {
            alert('Invalid graph file format');
          }
        } catch (error) {
          console.error('Import error:', error);
          alert('Failed to import graph. Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          <h1>🔍 SafetyMindPro</h1>
        </div>
        <div className="workspace-header-right">
          <span className="user-name">{user?.username}</span>
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="workspace-container">
        <aside className="workspace-sidebar">
          <div className="domain-selector-panel">
            <h3>Domain</h3>
            {domains.map((d) => (
              <button
                key={d.name}
                className={`domain-btn ${selectedDomain === d.name ? 'active' : ''}`}
                onClick={() => handleDomainChange(d.name)}
              >
                <span className="domain-btn-icon">{domainIcons[d.name]}</span>
                <span className="domain-btn-text">{d.display_name}</span>
              </button>
            ))}
          </div>

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
            <div className="toolbar-info">
              <span className="domain-badge">
                {domainIcons[selectedDomain]} {domainInfo?.display_name}
              </span>
              <span className="graph-stats">
                Nodes: {graph.nodes.length} | Edges: {graph.edges.length}
              </span>
              {saveStatus && (
                <span className="save-status">{saveStatus}</span>
              )}
            </div>
            <div className="toolbar-actions">
              <button onClick={handleSaveGraph} className="btn btn-save" disabled={loading}>
                💾 Save
              </button>
              <button onClick={() => handleExportGraph('json')} className="btn btn-export" disabled={loading}>
                📥 Export
              </button>
              <button onClick={handleImportGraph} className="btn btn-import" disabled={loading}>
                📤 Import
              </button>
              <button onClick={handleClearGraph} className="btn btn-danger">
                🗑️ Clear
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
              <div className="spinner"></div>
              <p>Loading workspace...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default WorkspacePage;
