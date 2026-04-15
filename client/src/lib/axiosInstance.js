import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // Crucial for sending/receiving HTTP-Only Cookies
  xsrfCookieName: 'XSRF-TOKEN', // Axios automatically extracts this cookie
  xsrfHeaderName: 'X-XSRF-TOKEN', // And maps it to this header for CSRF protection
});

// ── Refresh Token Lock ──────────────────────────────────
// Prevents multiple concurrent 401s from triggering parallel refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Helper to read CSRF token from cookies
const getCSRFToken = () => {
  const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
  return match ? match[2] : null;
};

// ── Request Interceptor ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Natively grab the exact cookie and attach it securely
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }

  return config;
}, (error) => Promise.reject(error));

// ── Response Interceptor ────────────────────────────────
// Intercept 401 Unauthorized responses and attempt token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept non-401 errors or already-retried requests
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the refresh endpoint itself failed
    if (originalRequest.url === '/api/auth/refresh') {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Re-read the fresh CSRF token
        const csrfToken = getCSRFToken();
        if (csrfToken) {
          originalRequest.headers['X-XSRF-TOKEN'] = csrfToken;
        }
        return api(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Ping refresh endpoint using HTTP Only cookie
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/refresh`, {
        withCredentials: true,
      });
      
      const newToken = data.accessToken;
      
      // Save new access token back to whatever storage was being used
      if (sessionStorage.getItem('accessToken')) {
        sessionStorage.setItem('accessToken', newToken);
      } else {
        localStorage.setItem('accessToken', newToken);
      }

      // Update auth store if available
      try {
        const { default: useAuthStore } = await import('../store/useAuthStore.js');
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
      } catch {
        // Auth store not available — that's OK
      }

      // Process queued requests with the new token
      processQueue(null, newToken);

      // Small delay to allow cookie propagation before retrying
      await new Promise(resolve => setTimeout(resolve, 50));

      // Re-inject token and fire original request again
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
      // Re-read the fresh CSRF token from the updated cookie
      const freshCsrf = getCSRFToken();
      if (freshCsrf) {
        originalRequest.headers['X-XSRF-TOKEN'] = freshCsrf;
      }
      // Also clear old CSRF headers that might conflict
      delete originalRequest.headers['x-xsrf-token'];

      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      
      // Check if this was a background sync request — don't force logout for those
      if (originalRequest._isBackgroundSync) {
        console.warn('Background sync failed — will retry later');
        return Promise.reject(refreshErr);
      }

      // Refresh failed (cookie expired/invalid). Force logout.
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      
      // Prevent infinite loop by checking if we are already on a public page
      const publicPaths = ['/login', '/register', '/', '/about', '/verify-otp', '/forgot-password'];
      const isPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p));
      
      if (!isPublicPage) {
        window.location.href = '/login';
      }
      
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
