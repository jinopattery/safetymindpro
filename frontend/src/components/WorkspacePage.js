import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadDomainInfo(selectedDomain);
      loadDomainStyling(selectedDomain);
    }
  }, [selectedDomain]);

  const loadDomains = async () => {
    try {
      const data = await domainsAPI.getDomains();
      setDomains(data);
      if (!selectedDomain && data.length > 0) {
        setSelectedDomain(data[0].name);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

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
    if (window.confirm('Clear all nodes and edges?')) {
      setGraph({ nodes: [], edges: [] });
      setAlgorithmResults(null);
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
            </div>
            <div className="toolbar-actions">
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
