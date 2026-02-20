import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://rosa-cvetov-camelot770.amvera.io';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Max init data to every request
api.interceptors.request.use((config) => {
  const max = (window as any).WebApp;
  if (max?.initData) {
    config.headers['X-Max-Init-Data'] = max.initData;
  }
  return config;
});

export default api;
