import React, { useState } from 'react';
import './AlgorithmPanel.css';

function AlgorithmPanel({ domainInfo, onRunAlgorithm, loading }) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [params, setParams] = useState({});

  const handleRunClick = () => {
    if (!selectedAlgorithm) {
      alert('Please select an algorithm');
      return;
    }
    onRunAlgorithm(selectedAlgorithm.name, params);
  };

  const getDefaultParams = (algorithmName) => {
    // Return default parameters for common algorithms
    const defaults = {
      fmea_risk_analysis: { rpn_threshold: 100 },
      flow_balance_analysis: { tolerance: 0.05 },
      fraud_detection: { velocity_threshold: 5, amount_multiplier: 3.0 },
      correlation_analysis: { correlation_threshold: 0.7 },
      portfolio_risk: {},
      failure_propagation: { max_depth: 5 },
      anomaly_detection: {},
      aml_detection: { structuring_threshold: 10000 },
      risk_scoring: {},
      dependency_propagation: { max_depth: 4 },
      critical_components: { top_n: 5 }
    };
    return defaults[algorithmName] || {};
  };

  const handleAlgorithmSelect = (algo) => {
    setSelectedAlgorithm(algo);
    setParams(getDefaultParams(algo.name));
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || value }));
  };

  return (
    <div className="algorithm-panel">
      <h3>Analysis Algorithms</h3>
      
      <div className="algorithm-list">
        {domainInfo?.algorithms.map(algo => (
          <button
            key={algo.name}
            className={`algorithm-item ${selectedAlgorithm?.name === algo.name ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect(algo)}
          >
            <div className="algorithm-name">{algo.name.replace(/_/g, ' ').toUpperCase()}</div>
            <div className="algorithm-desc">{algo.description}</div>
          </button>
        ))}
      </div>

      {selectedAlgorithm && (
        <div className="algorithm-config">
          <h4>Parameters</h4>
          {Object.keys(params).length > 0 ? (
            <div className="params-list">
              {Object.entries(params).map(([key, value]) => (
                <div key={key} className="param-item">
                  <label>{key.replace(/_/g, ' ')}:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => updateParam(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-params">No parameters required</p>
          )}

          <button 
            onClick={handleRunClick} 
            className="btn btn-run"
            disabled={loading}
          >
            {loading ? '⏳ Running...' : '▶️ Run Analysis'}
          </button>
        </div>
      )}

      {!selectedAlgorithm && (
        <div className="algorithm-placeholder">
          <p>👆 Select an algorithm to configure and run</p>
        </div>
      )}
    </div>
  );
}

export default AlgorithmPanel;
