import React from 'react';
import './DomainSelector.css';

function DomainSelector({ domains, selectedDomain, onDomainChange }) {
  const domainIcons = {
    automotive: '🚗',
    process_plant: '⚙️',
    financial: '💰',
    trading: '📈'
  };

  return (
    <div className="domain-selector">
      <h3>Select Domain</h3>
      <div className="domain-list">
        {domains.map(domain => (
          <button
            key={domain.name}
            className={`domain-item ${selectedDomain === domain.name ? 'active' : ''}`}
            onClick={() => onDomainChange(domain.name)}
          >
            <span className="domain-icon">{domainIcons[domain.name] || '📊'}</span>
            <div className="domain-details">
              <div className="domain-name">{domain.display_name}</div>
              <div className="domain-desc">{domain.description}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedDomain && (
        <div className="domain-info">
          <h4>Domain Capabilities</h4>
          {domains.find(d => d.name === selectedDomain) && (
            <>
              <div className="info-section">
                <strong>Node Types:</strong>
                <ul>
                  {domains.find(d => d.name === selectedDomain).node_types.map(nt => (
                    <li key={nt.name}>
                      {nt.icon} {nt.display_name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="info-section">
                <strong>Edge Types:</strong>
                <ul>
                  {domains.find(d => d.name === selectedDomain).edge_types.map(et => (
                    <li key={et.name}>{et.display_name}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DomainSelector;
