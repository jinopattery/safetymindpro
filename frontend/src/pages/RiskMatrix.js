import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RiskMatrix() {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await axios.get('/api/v1/fmea/analyses');
      setAnalyses(response.data);
      if (response.data.length > 0) {
        setSelectedAnalysis(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const getRiskColor = (severity, occurrence) => {
    const risk = severity * occurrence;
    if (risk >= 50) return '#e74c3c';
    if (risk >= 20) return '#f39c12';
    return '#2ecc71';
  };

  const getRiskLabel = (severity, occurrence) => {
    const risk = severity * occurrence;
    if (risk >= 50) return 'High';
    if (risk >= 20) return 'Medium';
    return 'Low';
  };

  const plotFailureModes = () => {
    if (!selectedAnalysis) return [];
    
    return selectedAnalysis.failure_modes.map(fm => ({
      ...fm,
      risk: getRiskLabel(fm.severity, fm.occurrence),
      color: getRiskColor(fm.severity, fm.occurrence)
    }));
  };

  const failureModes = plotFailureModes();

  return (
    <div>
      <h1>Risk Matrix</h1>

      <div className="card">
        <div className="form-group">
          <label>Select FMEA Analysis</label>
          <select 
            value={selectedAnalysis?.id || ''}
            onChange={(e) => {
              const analysis = analyses.find(a => a.id === parseInt(e.target.value));
              setSelectedAnalysis(analysis);
            }}
          >
            {analyses.map(analysis => (
              <option key={analysis.id} value={analysis.id}>{analysis.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedAnalysis && (
        <>
          <div className="card">
            <h2>Risk Matrix (Severity vs Occurrence)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Occurrence →<br/>Severity ↓</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <th key={i}>{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(severity => (
                    <tr key={severity}>
                      <td style={{ fontWeight: 'bold' }}>{severity}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(occurrence => {
                        const fmInCell = failureModes.filter(
                          fm => fm.severity === severity && fm.occurrence === occurrence
                        );
                        return (
                          <td 
                            key={occurrence}
                            style={{ 
                              backgroundColor: getRiskColor(severity, occurrence),
                              color: 'white',
                              padding: '1rem',
                              position: 'relative'
                            }}
                          >
                            {fmInCell.length > 0 && (
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {fmInCell.length}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#2ecc71' }}></div>
                <span>Low Risk (1-19)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#f39c12' }}></div>
                <span>Medium Risk (20-49)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#e74c3c' }}></div>
                <span>High Risk (50+)</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Failure Modes by Risk Level</h2>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Failure Mode</th>
                  <th>Severity</th>
                  <th>Occurrence</th>
                  <th>Risk Level</th>
                  <th>RPN</th>
                </tr>
              </thead>
              <tbody>
                {failureModes
                  .sort((a, b) => b.rpn - a.rpn)
                  .map(fm => (
                    <tr key={fm.id}>
                      <td>{fm.component}</td>
                      <td>{fm.failure_mode}</td>
                      <td>{fm.severity}</td>
                      <td>{fm.occurrence}</td>
                      <td>
                        <span style={{
                          backgroundColor: fm.color,
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          {fm.risk}
                        </span>
                      </td>
                      <td>{fm.rpn}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RiskMatrix;