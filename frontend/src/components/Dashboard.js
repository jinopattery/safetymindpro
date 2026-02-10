import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const data = await domainsAPI.getDomains();
      setDomains(data);
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const domainIcons = {
    automotive: '🚗',
    process_plant: '⚙️',
    financial: '💰',
    trading: '📈'
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>🔍 SafetyMindPro</h1>
          <div className="user-info">
            <span>Welcome, {user?.full_name || user?.username}!</span>
            <button onClick={onLogout} className="btn btn-secondary">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h2>Select a Domain to Begin</h2>
          <p>Choose from our multi-domain graph analysis platform</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading domains...</p>
          </div>
        ) : (
          <div className="domains-grid">
            {domains.map((domain) => (
              <div
                key={domain.name}
                className="domain-card"
                onClick={() => navigate(`/workspace/${domain.name}`)}
              >
                <div className="domain-icon">
                  {domainIcons[domain.name] || '📊'}
                </div>
                <h3>{domain.display_name}</h3>
                <p>{domain.description}</p>
                <div className="domain-stats">
                  <span>{domain.node_types.length} node types</span>
                  <span>{domain.algorithms.length} algorithms</span>
                </div>
                <button className="btn btn-primary">
                  Open Workspace →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
