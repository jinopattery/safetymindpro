import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { domainsAPI } from '../api/domains';
import './Dashboard.css';

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="14" height="14">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const OpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    width="13" height="13">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

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
        <span className="dashboard-app-title">Automotive</span>
        <div className="dashboard-header-right">
          <span className="dashboard-user-name">{user?.full_name || user?.username}</span>
          <button onClick={onLogout} className="dashboard-btn-icon" title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-section">
            <div className="dashboard-sidebar-title">WORKSPACES</div>
            {loading ? (
              <div className="dashboard-sidebar-empty">Loading…</div>
            ) : domains.map((domain) => (
              <button
                key={domain.name}
                className="dashboard-sidebar-item"
                onClick={() => navigate(`/workspace/${domain.name}`)}
                title={domain.description}
              >
                <span className="dashboard-sidebar-icon">{domainIcons[domain.name] || '📊'}</span>
                <span className="dashboard-sidebar-label">{domain.display_name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-welcome">
            <h2>Select a Domain</h2>
            <p>Choose a workspace from the sidebar or the cards below.</p>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="dashboard-spinner"></div>
              <p>Loading domains…</p>
            </div>
          ) : (
            <div className="dashboard-domains-grid">
              {domains.map((domain) => (
                <div
                  key={domain.name}
                  className="dashboard-domain-card"
                  onClick={() => navigate(`/workspace/${domain.name}`)}
                >
                  <div className="dashboard-domain-icon">{domainIcons[domain.name] || '📊'}</div>
                  <div className="dashboard-domain-info">
                    <h3>{domain.display_name}</h3>
                    <div className="dashboard-domain-stats">
                      <span>{domain.node_types.length} nodes</span>
                      <span>{domain.algorithms.length} algorithms</span>
                    </div>
                  </div>
                  <div className="dashboard-domain-arrow"><OpenIcon /></div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
