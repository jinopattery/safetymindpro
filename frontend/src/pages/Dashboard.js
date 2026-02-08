import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalFMEA: 0,
    totalFTA: 0,
    highRiskCount: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const fmeaResponse = await axios.get('/api/v1/fmea/analyses');
      const ftaResponse = await axios.get('/api/v1/fta/trees');
      
      setStats({
        totalFMEA: fmeaResponse.data.length,
        totalFTA: ftaResponse.data.length,
        highRiskCount: fmeaResponse.data.filter(a => 
          a.failure_modes.some(fm => fm.rpn >= 100)
        ).length
      });

      setRecentAnalyses(fmeaResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#3498db', margin: '0' }}>{stats.totalFMEA}</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Total FMEA Analyses</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#2ecc71', margin: '0' }}>{stats.totalFTA}</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Fault Trees</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#e74c3c', margin: '0' }}>{stats.highRiskCount}</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>High Risk Items</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent FMEA Analyses</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>System</th>
              <th>Failure Modes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentAnalyses.map(analysis => (
              <tr key={analysis.id}>
                <td>{analysis.name}</td>
                <td>{analysis.system}</td>
                <td>{analysis.failure_modes.length}</td>
                <td>{new Date(analysis.created_at).toLocaleDateString()}</td>
                <td>
                  <Link to={`/fmea/${analysis.id}`} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link to="/fmea/create" className="btn btn-primary">Create FMEA Analysis</Link>
        <Link to="/fta/create" className="btn btn-primary">Create Fault Tree</Link>
      </div>
    </div>
  );
}

export default Dashboard;