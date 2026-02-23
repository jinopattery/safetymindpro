import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthForms.css';

function SignupForm({ onSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    gdpr_consent: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate minimum password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate maximum password length (bcrypt limitation)
    if (formData.password.length > 72) {
      setError('Password cannot be longer than 72 characters');
      setLoading(false);
      return;
    }

    if (!formData.gdpr_consent) {
      setError('You must accept the Privacy Policy and Terms of Use to continue.');
      setLoading(false);
      return;
    }

    const result = await onSignup({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      full_name: formData.full_name,
      gdpr_consent: formData.gdpr_consent,
    });
    
    if (!result.success) {
      if (result.error) {
        setError(result.error);
      } else {
        setError('Signup failed. Please try again or contact support if the problem persists.');
      }
      setLoading(false);
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
          <h2>Create Account</h2>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="johndoe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password * (6-72 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              maxLength={72}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              maxLength={72}
              placeholder="Re-enter password"
            />
          </div>

          {/* GDPR consent checkbox */}
          <div className="form-group consent-group">
            <label className="consent-label">
              <input
                type="checkbox"
                name="gdpr_consent"
                checked={formData.gdpr_consent}
                onChange={handleChange}
                required
              />
              <span>
                I have read and accept the{' '}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>{' '}
                and agree to the processing of my data as described therein. *
              </span>
            </label>
          </div>

          <p className="consent-note">
            After registration you will receive a verification email. Please check your inbox
            and confirm your address before logging in.
          </p>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupForm;
