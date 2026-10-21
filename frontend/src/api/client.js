import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  // Health
  getHealth: () => api.get('/health'),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),

  // Request Execution
  executeRequest: (data) => api.post('/requests/execute', data),

  // Test Cases
  getTestCases: () => api.get('/test-cases'),
  getTestCase: (id) => api.get(`/test-cases/${id}`),
  createTestCase: (data) => api.post('/test-cases', data),
  updateTestCase: (id, data) => api.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => api.delete(`/test-cases/${id}`),
  runTestCase: (id) => api.post(`/test-cases/${id}/run`),
  runAllTestCases: () => api.post('/test-cases/run-all'),

  // History
  getHistory: (params = {}) => api.get('/history', { params }),
  getHistoryItem: (id) => api.get(`/history/${id}`),
  clearHistory: () => api.delete('/history?confirm=true'),
  deleteHistoryItem: (id) => api.delete(`/history/${id}`),

  // AI Diagnostics
  analyzeError: (data) => api.post('/ai/analyze', data),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;
