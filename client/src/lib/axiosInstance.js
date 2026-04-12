import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // Crucial for sending/receiving HTTP-Only Cookies
  xsrfCookieName: 'XSRF-TOKEN', // Axios automatically extracts this cookie
  xsrfHeaderName: 'X-XSRF-TOKEN', // And maps it to this header for CSRF protection
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Natively grab the exact cookie and attach it securely
  const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
  if (match) {
    config.headers['X-XSRF-TOKEN'] = match[2];
  }

  return config;
}, (error) => Promise.reject(error));

// Intercept Responses to dynamically catch 401 Unauthorized (Expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh itself fails
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh') {
      originalRequest._retry = true;
      try {
        // Ping refresh endpoint using HTTP Only cookie
        const { data } = await axios.get(`${BACKEND_URL}/api/auth/refresh`, {
          withCredentials: true,
        });
        
        // Save new raw access token back to whatever memory partition they were originally relying on
        if (sessionStorage.getItem('accessToken')) {
          sessionStorage.setItem('accessToken', data.accessToken);
        } else {
          localStorage.setItem('accessToken', data.accessToken);
        }
        
        // Delete the stale CSRF header so Axios natively re-reads the fresh cookie we just got!
        delete originalRequest.headers['X-XSRF-TOKEN'];
        delete originalRequest.headers['x-xsrf-token'];
        
        // Re-inject token and fire original request again magically
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        
        // Dynamically slice the fresh CSRF token!
        const csrfMatch = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
        if (csrfMatch) {
          originalRequest.headers['X-XSRF-TOKEN'] = csrfMatch[2];
        }

        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh failed (cookie expired/invalid). Force logout.
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        
        // Prevent infinite loop by checking if we are already on the login page before redirecting
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/' && window.location.pathname !== '/about') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
