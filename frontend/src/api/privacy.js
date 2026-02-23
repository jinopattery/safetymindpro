/**
 * Privacy & GDPR API Client
 */

import axios from 'axios';

const API_BASE = '/api/v1/privacy';

export const privacyAPI = {
  // GDPR Article 15 – Right of access: export personal data
  getMyData: async () => {
    const response = await axios.get(`${API_BASE}/my-data`);
    return response.data;
  },

  // GDPR Article 17 – Right to erasure: delete account
  deleteAccount: async () => {
    const response = await axios.delete(`${API_BASE}/delete-account`);
    return response.data;
  },

  // View own activity / audit log
  getActivityLog: async () => {
    const response = await axios.get(`${API_BASE}/activity-log`);
    return response.data;
  },

  // Admin: privacy compliance statistics
  getAdminStats: async () => {
    const response = await axios.get(`${API_BASE}/admin/stats`);
    return response.data;
  },
};
