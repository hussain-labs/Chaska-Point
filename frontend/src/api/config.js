import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * API Configuration
 * Base axios instance with interceptors for auth token injection.
 */

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('SecureStore read error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Token expired or invalid - will be handled by AuthContext
        console.log('Unauthorized - token may be expired');
      }
      return Promise.reject(data);
    }
    return Promise.reject({ message: 'Network error. Please check your connection.' });
  }
);

export default api;
export { API_BASE_URL };
