import React, { useState } from 'react';
import { privacyAPI } from '../api/privacy';
import { authAPI } from '../api/auth';
import './MyPrivacyData.css';

function MyPrivacyData({ onAccountDeleted }) {
  const [myData, setMyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await privacyAPI.getMyData();
      setMyData(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!myData) return;
    const blob = new Blob([JSON.stringify(myData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safetymindpro-my-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await privacyAPI.deleteAccount();
      authAPI.logout();
      onAccountDeleted();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="privacy-data">
      <h3>My Privacy Data (GDPR)</h3>
      <p className="privacy-data__intro">
        Under the GDPR you have the right to access all personal data we hold about you
        and the right to have it deleted.
      </p>

      {error && <div className="privacy-data__error">⚠️ {error}</div>}

      <div className="privacy-data__actions">
        <button className="btn btn-secondary" onClick={handleExport} disabled={loading}>
          {loading ? 'Loading…' : '📥 View / Export my data'}
        </button>
      </div>

      {myData && (
        <div className="privacy-data__result">
          <div className="privacy-data__summary">
            <p><strong>Email:</strong> {myData.email}</p>
            <p><strong>Username:</strong> {myData.username}</p>
            <p><strong>Account created:</strong> {new Date(myData.created_at).toLocaleDateString()}</p>
            <p><strong>Last login:</strong> {myData.last_login ? new Date(myData.last_login).toLocaleString() : '—'}</p>
            <p><strong>Email verified:</strong> {myData.email_verified ? 'Yes ✅' : 'No ⚠️'}</p>
            <p><strong>Privacy consent given:</strong> {myData.gdpr_consent_at ? new Date(myData.gdpr_consent_at).toLocaleDateString() : '—'}</p>
          </div>

          {myData.activity_log && myData.activity_log.length > 0 && (
            <div className="privacy-data__log">
              <h4>Recent activity</h4>
              <table>
                <thead>
                  <tr><th>Action</th><th>Date</th><th>IP</th></tr>
                </thead>
                <tbody>
                  {myData.activity_log.slice(0, 10).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.action}</td>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>{entry.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleDownloadJSON} style={{ marginTop: '12px' }}>
            💾 Download as JSON
          </button>
        </div>
      )}

      <div className="privacy-data__danger">
        <h4>Delete my account</h4>
        <p>
          This will permanently delete your account and all associated data.
          This action cannot be undone.
        </p>
        {!confirmDelete ? (
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            🗑 Delete my account
          </button>
        ) : (
          <div className="privacy-data__confirm">
            <p><strong>Are you sure?</strong> All your data will be permanently erased.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPrivacyData;
