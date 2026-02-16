/**
 * Domains API Client
 */

import axios from 'axios';

const API_BASE = '/api/v1';

axios.defaults.baseURL = 'http://localhost:8000';

// Add token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const domainsAPI = {
  // Get all available domains
  getDomains: async () => {
    const response = await axios.get(`${API_BASE}/domains/info`);
    return response.data;
  },

  // Get specific domain info
  getDomainInfo: async (domainName) => {
    const response = await axios.get(`${API_BASE}/domains/${domainName}/info`);
    return response.data;
  },

  // Get domain styling
  getDomainStyling: async (domainName) => {
    const response = await axios.get(`${API_BASE}/domains/${domainName}/styling`);
    return response.data;
  },

  // Get domain algorithms
  getDomainAlgorithms: async (domainName) => {
    const response = await axios.get(`${API_BASE}/domains/${domainName}/algorithms`);
    return response.data;
  },

  // Run algorithm
  runAlgorithm: async (domain, algorithmName, graphData, params = {}) => {
    const response = await axios.post(`${API_BASE}/domains/run-algorithm`, {
      domain,
      algorithm_name: algorithmName,
      graph_data: graphData,
      params
    });
    return response.data;
  },

  // Validate node
  validateNode: async (domain, nodeData) => {
    const response = await axios.post(`${API_BASE}/domains/${domain}/validate-node`, nodeData);
    return response.data;
  },

  // Validate edge
  validateEdge: async (domain, edgeData) => {
    const response = await axios.post(`${API_BASE}/domains/${domain}/validate-edge`, edgeData);
    return response.data;
  },

  // Save graph
  saveGraph: async (name, description, graphData, domain) => {
    const response = await axios.post(`${API_BASE}/domains/save-graph`, {
      name,
      description,
      graph_data: graphData,
      domain
    });
    return response.data;
  },

  // Export graph
  exportGraph: async (graphData, format = 'json') => {
    const response = await axios.post(`${API_BASE}/domains/export-graph`, {
      graph_data: graphData,
      format
    });
    return response.data;
  }
};
