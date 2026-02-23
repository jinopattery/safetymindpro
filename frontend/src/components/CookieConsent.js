import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const STORAGE_KEY = 'cookie_consent_accepted';

function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner__content">
        <span className="cookie-banner__icon">🍪</span>
        <p>
          SafetyMindPro uses a strictly necessary session token stored in{' '}
          <code>localStorage</code> to keep you logged in. We do <strong>not</strong>{' '}
          use any tracking or advertising cookies. Read our{' '}
          <Link to="/privacy-policy">Privacy Policy</Link> for details.
        </p>
      </div>
      <button className="cookie-banner__accept" onClick={handleAccept}>
        Accept &amp; Close
      </button>
    </div>
  );
}

export default CookieConsent;
