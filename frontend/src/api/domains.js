/**
 * Domains API Client
 */

import axios from 'axios';

const API_BASE = '/api/v1';

axios.defaults.baseURL = 'http://localhost:8000';

// Handle 401 responses by clearing the session and redirecting to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

  // List saved graphs (optionally filtered by domain)
  listGraphs: async (domain = null) => {
    const params = domain ? { domain } : {};
    const response = await axios.get(`${API_BASE}/domains/list-graphs`, { params });
    return response.data;
  },

  // Load a graph by ID
  loadGraph: async (graphId) => {
    const response = await axios.get(`${API_BASE}/domains/load-graph/${graphId}`);
    return response.data;
  },

  // Delete a graph by ID
  deleteGraph: async (graphId) => {
    const response = await axios.delete(`${API_BASE}/domains/delete-graph/${graphId}`);
    return response.data;
  },

  // Update an existing saved graph in-place (overwrite)
  updateGraph: async (graphId, graphData, name = null) => {
    const body = { graph_data: graphData };
    if (name) body.name = name;
    const response = await axios.put(`${API_BASE}/domains/update-graph/${graphId}`, body);
    return response.data;
  },

  // Export graph
  exportGraph: async (graphData, format = 'json') => {
    const response = await axios.post(`${API_BASE}/domains/export-graph`, {
      graph_data: graphData,
      format
    });
    return response.data;
  },

  // Validate diagram connectivity and allocation
  validateDiagram: async (domain, graphData) => {
    const response = await axios.post(`${API_BASE}/domains/validate-diagram`, {
      domain,
      graph_data: graphData,
    });
    return response.data;
  },
};
