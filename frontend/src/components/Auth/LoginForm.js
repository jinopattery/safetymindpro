import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import './AuthForms.css';

function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendVerificationLink, setResendVerificationLink] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setUnverifiedEmail('');
    setResendStatus('');
    setResendVerificationLink(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverifiedEmail('');
    setResendStatus('');
    setResendVerificationLink(null);

    const result = await onLogin(formData);
    
    if (!result.success) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        // Show a helpful banner with a resend link instead of a raw error
        setUnverifiedEmail(formData.username);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      // The backend resolves both username and email, so passing the username
      // entered in the login form is sufficient.
      const data = await authAPI.resendVerification(unverifiedEmail);
      if (data.verification_link) {
        setResendVerificationLink(data.verification_link);
      }
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Welcome Back</h2>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {unverifiedEmail && (
            <div className="info-message">
              📧 Your email address has not been verified yet. Please check your inbox
              and click the verification link.
              {resendStatus !== 'sent' && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleResend}
                  disabled={resendStatus === 'sending'}
                >
                  {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
              {resendStatus === 'sent' && (
                <span className="resend-ok"> ✓ {resendVerificationLink && /^https?:\/\//.test(resendVerificationLink) ? (
                  <>Verification link ready –{' '}
                    <a href={resendVerificationLink} className="btn-link" target="_blank" rel="noopener noreferrer">click here to verify your email</a>.
                  </>
                ) : 'Email sent – please check your inbox.'}</span>
              )}
              {resendStatus === 'error' && (
                <span className="resend-error"> Could not send email, please try again later.</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
            <p className="auth-legal-links">
              <Link to="/terms-and-conditions">Terms</Link>
              {' · '}
              <Link to="/privacy-policy">Privacy</Link>
              {' · '}
              <Link to="/plans">Plans</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
