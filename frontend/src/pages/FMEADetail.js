import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function FMEADetail() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
    loadRiskSummary();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const response = await axios.get(`/api/v1/fmea/analyses/${id}`);
      setAnalysis(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading analysis:', error);
      setLoading(false);
    }
  };

  const loadRiskSummary = async () => {
    try {
      const response = await axios.get(`/api/v1/fmea/analyses/${id}/risk-summary`);
      setRiskSummary(response.data);
    } catch (error) {
      console.error('Error loading risk summary:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await axios.get(`/api/v1/fmea/analyses/${id}/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FMEA_${analysis.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!analysis) return <div>Analysis not found</div>;

  const getRPNColor = (rpn) => {
    if (rpn >= 200) return '#e74c3c';
    if (rpn >= 100) return '#f39c12';
    return '#2ecc71';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link to="/fmea" style={{ color: '#3498db', marginBottom: '0.5rem', display: 'block' }}>← Back to FMEA List</Link>
          <h1>{analysis.name}</h1>
        </div>
        <button onClick={exportToExcel} className="btn btn-primary">Export to Excel</button>
      </div>

      <div className="card">
        <h2>Analysis Information</h2>
        <p><strong>Description:</strong> {analysis.description || 'N/A'}</p>
        <p><strong>System:</strong> {analysis.system}</p>
        <p><strong>Subsystem:</strong> {analysis.subsystem || 'N/A'}</p>
        <p><strong>Created:</strong> {new Date(analysis.created_at).toLocaleString()}</p>
      </div>

      {riskSummary && (
        <div className="card">
          <h2>Risk Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Total Failure Modes</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>{riskSummary.total_failure_modes}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Average RPN</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>{riskSummary.average_rpn.toFixed(1)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Max RPN</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>{riskSummary.max_rpn}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>High Risk Count</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>{riskSummary.high_risk_count}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Failure Modes</h2>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Function</th>
              <th>Failure Mode</th>
              <th>Effects</th>
              <th>Causes</th>
              <th>S</th>
              <th>O</th>
              <th>D</th>
              <th>RPN</th>
            </tr>
          </thead>
          <tbody>
            {analysis.failure_modes.map(fm => (
              <tr key={fm.id}>
                <td>{fm.component}</td>
                <td>{fm.function}</td>
                <td>{fm.failure_mode}</td>
                <td>{fm.failure_effects}</td>
                <td>{fm.failure_causes}</td>
                <td>{fm.severity}</td>
                <td>{fm.occurrence}</td>
                <td>{fm.detection}</td>
                <td>
                  <span style={{ 
                    backgroundColor: getRPNColor(fm.rpn),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {fm.rpn}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analysis.failure_modes.length > 0 && (
        <div className="card">
          <h2>RPN Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.failure_modes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="component" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rpn" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default FMEADetail;