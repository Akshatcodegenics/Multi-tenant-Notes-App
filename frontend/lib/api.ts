import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      Cookies.set('token', response.data.token, { expires: 1 }); // 1 day
    }
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
  },

  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Notes APIs
export const notesAPI = {
  getAll: async (page = 1, limit = 50) => {
    const response = await api.get(`/api/notes?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/notes/${id}`);
    return response.data;
  },

  create: async (title: string, content: string) => {
    const response = await api.post('/api/notes', { title, content });
    return response.data;
  },

  update: async (id: string, title: string, content: string) => {
    const response = await api.put(`/api/notes/${id}`, { title, content });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/notes/${id}`);
    return response.data;
  },
};

// Tenant APIs
export const tenantAPI = {
  getCurrent: async () => {
    const response = await api.get('/api/tenants/current');
    return response.data;
  },

  upgrade: async (slug: string) => {
    const response = await api.post(`/api/tenants/${slug}/upgrade`);
    return response.data;
  },
};

// Health API
export const healthAPI = {
  check: async () => {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  },
};

export default api;