import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function FMEAList() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await axios.get('/api/v1/fmea/analyses');
      setAnalyses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading analyses:', error);
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await axios.delete(`/api/v1/fmea/analyses/${id}`);
        loadAnalyses();
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>FMEA Analyses</h1>
        <Link to="/fmea/create" className="btn btn-primary">Create New FMEA</Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>System</th>
              <th>Subsystem</th>
              <th>Failure Modes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map(analysis => (
              <tr key={analysis.id}>
                <td>{analysis.name}</td>
                <td>{analysis.system}</td>
                <td>{analysis.subsystem || '-'}</td>
                <td>{analysis.failure_modes.length}</td>
                <td>{new Date(analysis.created_at).toLocaleDateString()}</td>
                <td>
                  <Link to={`/fmea/${analysis.id}`} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
                    View
                  </Link>
                  <button 
                    onClick={() => deleteAnalysis(analysis.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FMEAList;