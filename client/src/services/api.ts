import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lovelyhome_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor to transform raw technical errors into friendly user messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network offline failure
      error.message = 'Network connection unavailable. Please check your internet connection and try again.';
    } else if (error.response.status >= 500) {
      // Server error fallback
      const originalMessage = error.response.data?.error;
      if (!originalMessage || originalMessage.includes('Prisma') || originalMessage.includes('Error:')) {
        error.response.data = {
          error: "We couldn't process this request. Please try again shortly or contact support if the issue persists."
        };
      }
    }
    return Promise.reject(error);
  }
);

export default api;
