import axios from 'axios';
import { isTokenExpired } from '../utils/jwtUtils';
import { cookieUtils } from '../utils/cookieUtils';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5027';

// Only log in development
if (import.meta.env.MODE === 'development') {
  console.log('API Base URL:', baseURL);
}

// Variable to hold the store instance
let store: any;

// Function to inject store from main.tsx
export const injectStore = (_store: any) => {
  store = _store;
};

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from cookies instead of Redux state
    const token = cookieUtils.getToken();

    if (token) {
      // Check if token is expired before making the request
      if (isTokenExpired(token)) {
        if (store) {
          store.dispatch({ type: 'auth/logout' });
        }
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }

      // Attach Authorization header only if app state has user logged-in
      // We need store to check this safely
      if (store) {
        const state = store.getState();
        if (!state.auth.user) {
          return config;
        }
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired/invalid on server side)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Logout user and redirect to login
      if (store) {
        store.dispatch({ type: 'auth/logout' });
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export default api;