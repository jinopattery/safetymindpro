import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/auth';
import '../components/Auth/AuthForms.css';

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error | no-token
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('no-token');
      return;
    }

    authAPI.verifyEmail(token)
      .then((data) => {
        setMessage(data.message || 'Email verified successfully. You can now log in.');
        setStatus('success');
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.detail ||
          'Verification failed. The link may have expired or already been used.'
        );
        setStatus('error');
      });
  }, [searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="auth-form">
          <h2>Email Verification</h2>

          {status === 'verifying' && (
            <p style={{ color: '#64748b', textAlign: 'center' }}>
              Verifying your email address…
            </p>
          )}

          {status === 'success' && (
            <>
              <div className="info-message" style={{ borderColor: '#22c55e', background: '#f0fdf4', color: '#15803d' }}>
                ✅ {message}
              </div>
              <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none', display: 'block', padding: '10px 20px', marginTop: '12px' }}>
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="error-message">⚠️ {message}</div>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Need a new verification link?{' '}
                <Link to="/login">Log in</Link> and use the "Resend verification email" option.
              </p>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="error-message">
                ⚠️ No verification token found in the URL. Please use the link from your verification email.
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
                <Link to="/login">Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;
