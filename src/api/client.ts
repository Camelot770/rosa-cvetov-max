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
  // Try Max WebApp (via bridge.js)
  const max = (window as any).WebApp;
  if (max?.initData) {
    config.headers['X-Max-Init-Data'] = max.initData;
  } else {
    // Debug: log what's available
    console.warn('[Max Auth] WebApp.initData is empty. WebApp object:', !!max, 'initData:', max?.initData);
  }
  return config;
});

export default api;
