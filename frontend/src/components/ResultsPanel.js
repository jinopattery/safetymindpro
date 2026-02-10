import React, { useState } from 'react';
import './ResultsPanel.css';

function ResultsPanel({ results, domainName }) {
  const [expanded, setExpanded] = useState(true);

  const renderValue = (value) => {
    if (Array.isArray(value)) {
      return (
        <ul className="results-list">
          {value.slice(0, 10).map((item, idx) => (
            <li key={idx}>
              {typeof item === 'object' ? (
                <details>
                  <summary>Item {idx + 1}</summary>
                  {renderObject(item)}
                </details>
              ) : (
                String(item)
              )}
            </li>
          ))}
          {value.length > 10 && (
            <li className="more-indicator">... and {value.length - 10} more</li>
          )}
        </ul>
      );
    } else if (typeof value === 'object' && value !== null) {
      return renderObject(value);
    } else if (typeof value === 'number') {
      return <span className="number-value">{value.toFixed(2)}</span>;
    } else if (typeof value === 'boolean') {
      return <span className={`boolean-value ${value ? 'true' : 'false'}`}>{String(value)}</span>;
    } else {
      return String(value);
    }
  };

  const renderObject = (obj) => {
    return (
      <div className="object-container">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="object-field">
            <strong>{key.replace(/_/g, ' ')}:</strong> {renderValue(value)}
          </div>
        ))}
      </div>
    );
  };

  const getSummaryStats = () => {
    const stats = [];
    
    // Domain-specific summary extraction
    if (domainName === 'automotive') {
      if (results.high_risk_failures) {
        stats.push({ label: 'High Risk Failures', value: results.high_risk_failures.length, color: 'red' });
      }
      if (results.total_analyzed) {
        stats.push({ label: 'Total Analyzed', value: results.total_analyzed, color: 'blue' });
      }
    } else if (domainName === 'process_plant') {
      if (results.total_anomalies) {
        stats.push({ label: 'Anomalies Detected', value: results.total_anomalies, color: 'orange' });
      }
      if (results.equipment_checked) {
        stats.push({ label: 'Equipment Checked', value: results.equipment_checked, color: 'blue' });
      }
    } else if (domainName === 'financial') {
      if (results.total_flagged) {
        stats.push({ label: 'Suspicious Transactions', value: results.total_flagged, color: 'red' });
      }
      if (results.total_alerts) {
        stats.push({ label: 'AML Alerts', value: results.total_alerts, color: 'orange' });
      }
    } else if (domainName === 'trading') {
      if (results.total_high_correlations) {
        stats.push({ label: 'High Correlations', value: results.total_high_correlations, color: 'orange' });
      }
      if (results.high_risk_accounts || results.high_risk_portfolios) {
        const val = results.high_risk_accounts || results.high_risk_portfolios;
        stats.push({ label: 'High Risk', value: val, color: 'red' });
      }
    }

    return stats;
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="results-panel">
      <div className="results-header">
        <h3>📊 Analysis Results</h3>
        <button 
          className="btn-expand" 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {summaryStats.length > 0 && (
        <div className="summary-stats">
          {summaryStats.map((stat, idx) => (
            <div key={idx} className={`stat-card stat-${stat.color}`}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div className="results-content">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="result-section">
              <h4>{key.replace(/_/g, ' ').toUpperCase()}</h4>
              <div className="result-value">
                {renderValue(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="results-actions">
        <button className="btn btn-export" onClick={() => {
          const dataStr = JSON.stringify(results, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${domainName}_results_${Date.now()}.json`;
          link.click();
        }}>
          💾 Export Results
        </button>
      </div>
    </div>
  );
}

export default ResultsPanel;
