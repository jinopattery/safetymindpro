/**
 * Authentication API Client
 */

import axios from 'axios';

const API_BASE = '/api/v1';

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  // Sign up new user
  signup: async (userData) => {
    const response = await axios.post(`${API_BASE}/auth/signup`, userData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login existing user
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await axios.post(`${API_BASE}/auth/login`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Verify email address with token
  verifyEmail: async (token) => {
    const response = await axios.post(`${API_BASE}/auth/verify-email`, { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await axios.post(`${API_BASE}/auth/resend-verification`, { email });
    return response.data;
  },

  // Get current user
  me: async () => {
    const response = await axios.get(`${API_BASE}/auth/me`);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user from storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
