import axios from 'axios';

// Use relative /api to utilize Vite proxy or direct port
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  timeout: 15000
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('qlm_auth_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized responses and trigger seamless re-auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginUrl = error.config?.url?.includes('/auth/login');
      const isVerifyUrl = error.config?.url?.includes('/auth/verify');
      const hadToken = Boolean(localStorage.getItem('qlm_auth_token'));
      if (!isLoginUrl && !isVerifyUrl && hadToken) {
        localStorage.removeItem('qlm_auth_token');
        localStorage.removeItem('qlm_auth_user');
        window.dispatchEvent(new CustomEvent('qlm-unauthorized', {
          detail: { message: error.response?.data?.error || 'Session expired' }
        }));
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data?.token) {
    localStorage.setItem('qlm_auth_token', res.data.token);
    localStorage.setItem('qlm_auth_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const verifyToken = async () => {
  const res = await api.get(`/auth/verify?_t=${Date.now()}`);
  return res.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (_) { }
  localStorage.removeItem('qlm_auth_token');
  localStorage.removeItem('qlm_auth_user');
  window.dispatchEvent(new CustomEvent('qlm-unauthorized', {
    detail: { message: 'Logged out' }
  }));
};

// Analytics
export const fetchAnalytics = async () => {
  const res = await api.get(`/analytics/dashboard?_t=${Date.now()}`);
  return res.data.data;
};

export const fetchAuditLogs = async (limit = 50) => {
  const res = await api.get(`/analytics/audit-logs?limit=${limit}&_t=${Date.now()}`);
  return res.data.data;
};

// Customers
export const fetchCustomers = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.search) query.append('search', filters.search);
  if (filters.country) query.append('country', filters.country);
  if (filters.tier) query.append('tier', filters.tier);
  if (filters.status) query.append('status', filters.status);
  query.append('_t', Date.now());

  const res = await api.get(`/customers?${query.toString()}`);
  return res.data.data;
};

export const fetchCustomerById = async (id) => {
  const res = await api.get(`/customers/${id}?_t=${Date.now()}`);
  return res.data.data;
};

// Licenses
export const fetchLicenses = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.search) query.append('search', filters.search);
  if (filters.status) query.append('status', filters.status);
  if (filters.productId) query.append('productId', filters.productId);
  if (filters.type) query.append('type', filters.type);
  if (filters.customerId) query.append('customerId', filters.customerId);
  query.append('_t', Date.now());

  const res = await api.get(`/licenses?${query.toString()}`);
  return res.data.data;
};

export const fetchLicenseById = async (id) => {
  const res = await api.get(`/licenses/${id}?_t=${Date.now()}`);
  return res.data.data;
};

export const fetchProducts = async () => {
  const res = await api.get(`/products?_t=${Date.now()}`);
  return res.data.data;
};

export const createProduct = async (productData) => {
  const res = await api.post('/products', productData);
  return res.data;
};

export const createLicense = async (licenseData) => {
  const res = await api.post('/licenses/create', licenseData);
  return res.data;
};

export const deactivateLicense = async (payload) => {
  const res = await api.post('/licenses/deactivate', payload);
  return res.data;
};

export const revokeLicense = async (payload) => {
  const res = await api.post('/licenses/revoke', payload);
  return res.data;
};

export default api;

