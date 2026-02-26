import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// API
import { authAPI } from './api/auth';

// Components
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Dashboard from './components/Dashboard';
import WorkspacePage from './components/WorkspacePage';
import CookieConsent from './components/CookieConsent';

// Pages
import EmailVerification from './pages/EmailVerification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import AITerms from './pages/AITerms';
import Plans from './pages/Plans';
import FinancialDataSources from './pages/FinancialDataSources';
import AutomotiveDataSources from './pages/AutomotiveDataSources';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authAPI.isAuthenticated());
  const [user, setUser] = useState(authAPI.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          authAPI.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const data = await authAPI.login(credentials.username, credentials.password);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const detail = error.response?.data?.detail || 'Login failed';
      return { success: false, error: detail };
    }
  };

  const handleSignup = async (userData) => {
    try {
      const data = await authAPI.signup(userData);
      setUser(data.user);
      // After signup keep user on a "check your email" state – do not auto-login
      setIsAuthenticated(false);
      return { success: true, verificationLink: data.verification_link || null };
    } catch (error) {
      console.error('Signup failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      };
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading SafetyMindPro...</p>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <CookieConsent />
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <LoginForm onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <SignupForm onSignup={handleSignup} />
            } 
          />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/ai-terms" element={<AITerms />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/financial-data-sources" element={<FinancialDataSources />} />
          <Route path="/automotive-data-sources" element={<AutomotiveDataSources />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/workspace/:domain?" 
            element={
              isAuthenticated ? 
              <WorkspacePage user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />

          {/* Default route */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
