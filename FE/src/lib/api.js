import axios from 'axios';
import { queryClient } from './queryClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Token being sent:", token);
  } else {
    console.log("🔐 No token found in sessionStorage.");
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  googleAuth: (token, role) => api.post('/auth/google', { token, role }),
  getMe: () => api.get('/auth/me').then(res => res.data.user),
};

// User API
export const userAPI = {
  updateProfile: (updates) => api.put('/users/profile', updates),
  getUsers: (params) => api.get('/users', { params }),
};

// Product API
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductsByVendor:(id) => api.get(`/vendors/${id}/products`),
  createProduct: (product) => api.post('/products', product),
  updateProduct: (id, updates) => api.put(`/products/${id}`, updates),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Category API
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  createCategory: (category) => api.post('/categories', category),
  updateCategory: (id, category) => api.put(`/categories/${id}`, category),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// RFQ API
export const rfqAPI = {
  getRfqs: () => api.get('/rfqs'),
  incomingRfqs: () => api.get('/rfqs/incoming'),
  getRfq: (id) => api.get(`/rfqs/${id}`),
  createRfq: (rfq) => api.post('/rfqs', rfq),
  getQuotes: (rfqId) => api.get(`/rfqs/${rfqId}/quotes`),
  createQuote: (rfqId, quote) => api.post(`/rfqs/${rfqId}/quotes`, quote),
  acceptQuote: (quoteId) => api.post(`/quotes/${quoteId}/accept`),
};

// Order API
export const orderAPI = {
  createOrder: (orderData) => api.post("/orders", orderData),
  getOrders: () => api.get('/orders'),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Negotiation API
export const negotiationAPI = {
  getNegotiations: () => api.get('/negotiations'),
  createNegotiation: (negotiation) => api.post('/negotiations', negotiation),
  sendMessage: (id, message) => api.post(`/negotiations/${id}/message`, message),
  aiNegotiate: (id, message) => api.post(`/negotiations/${id}/ai-negotiate`, { message }),
  acceptNegotiation: (id) => api.post(`/negotiations/${id}/accept`),
  getNegotiationById: (id) => api.get(`/getNegotiationById/${id}`)
};

// AI API
export const aiAPI = {
  getPriceRecommendation: (productId) => api.post('/ai/price-recommendation', { productId }),
  getDemandForecast: (productId) => api.post('/ai/demand-forecast', { productId }),
  getRiskAssessment: (userId) => api.post('/ai/risk-assessment', { userId }),
};

// Dashboard API
export const dashboardAPI = {
  getVendorStats: () => api.get('/dashboard/vendor-stats'),
  getBuyerStats: () => api.get('/dashboard/buyer-stats'),
  getAdminStats: () => api.get('/dashboard/admin-stats'),
  getStats: () => api.get('/dashboard/stats'),
};

// Re-export queryClient for compatibility
export { queryClient };
