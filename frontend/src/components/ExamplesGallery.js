import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExamplesGallery.css';

// Static metadata for bundled example graphs.
// The JSON files live in /public/examples/ and are served as static assets.
const EXAMPLES = [
  {
    id: 'graph-automotive-1772366386944',
    domain: 'automotive',
    domainLabel: 'Automotive',
    title: 'Brake System FMEA',
    description: 'Form–Function–Failure model of a vehicle braking system (hydraulic unit, brake pads, caliper).',
    file: '/examples/graph-automotive-1772366386944.json',
    icon: '🚗',
  },
  {
    id: 'graph-finance-multi-country-multi-industry-depo',
    domain: 'financial',
    domainLabel: 'Financial',
    title: 'Multi-Country Multi-Industry Depot',
    description: 'Portfolio risk model spanning European equities, US bonds, Asia ETF and Real Estate REIT.',
    file: '/examples/graph-finance-multi-country-multi-industry-depo.json',
    icon: '💰',
  },
];

/**
 * ExamplesGallery
 *
 * Props:
 *   onLoadExample  – optional callback(graphData, domain) called when user
 *                    clicks "Load into workspace" (only provided from WorkspacePage)
 */
function ExamplesGallery({ onLoadExample, className }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // id of example being fetched
  const [error, setError] = useState(null);

  const fetchExample = async (example) => {
    setLoading(example.id);
    setError(null);
    try {
      const res = await fetch(example.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const graphData = await res.json();
      if (!graphData.nodes || !graphData.edges) throw new Error('Invalid graph format');
      return graphData;
    } catch (err) {
      setError(`Failed to load "${example.title}": ${err.message}`);
      return null;
    } finally {
      setLoading(null);
    }
  };

  const handleLoad = async (example) => {
    const graphData = await fetchExample(example);
    if (graphData && onLoadExample) {
      onLoadExample(graphData, example.domain);
    }
  };

  const handleOpenInWorkspace = async (example) => {
    const graphData = await fetchExample(example);
    if (graphData) {
      navigate(`/workspace/${example.domain}`, { state: { exampleGraph: graphData } });
    }
  };

  return (
    <section className={`eg-section${className ? ` ${className}` : ''}`}>
      <div className="eg-header">
        <span className="eg-header-icon">📂</span>
        <h3 className="eg-title">Examples Gallery</h3>
      </div>
      {error && <div className="eg-error">{error}</div>}
      <div className="eg-cards">
        {EXAMPLES.map(ex => (
          <div key={ex.id} className="eg-card">
            <div className="eg-card-icon">{ex.icon}</div>
            <div className="eg-card-body">
              <div className="eg-card-domain">{ex.domainLabel}</div>
              <div className="eg-card-title">{ex.title}</div>
              <div className="eg-card-desc">{ex.description}</div>
            </div>
            <div className="eg-card-actions">
              {onLoadExample ? (
                <button
                  className="eg-btn eg-btn-primary"
                  onClick={() => handleLoad(ex)}
                  disabled={loading === ex.id}
                  title="Load nodes and edges into the current workspace"
                >
                  {loading === ex.id ? '⏳' : '⬇'} Load into workspace
                </button>
              ) : (
                <button
                  className="eg-btn eg-btn-primary"
                  onClick={() => handleOpenInWorkspace(ex)}
                  disabled={loading === ex.id}
                  title="Open this example in the workspace"
                >
                  {loading === ex.id ? '⏳' : '▶'} Open in workspace
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExamplesGallery;
