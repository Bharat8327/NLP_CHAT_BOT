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

// we no longer read CSRF from cookies in cross-origin mode


// ── Request Interceptor ─────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Pull CSRF token from store (needed for cross-origin deployments)
  try {
    const { default: useAuthStore } = await import('../store/useAuthStore.js');
    const csrfToken = useAuthStore.getState().csrfToken;
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  } catch {
    // Auth store not ready yet
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
      }).then(async (newToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Re-read the fresh CSRF token from store
        try {
          const { default: useAuthStore } = await import('../store/useAuthStore.js');
          const csrfToken = useAuthStore.getState().csrfToken;
          if (csrfToken) {
            originalRequest.headers['X-XSRF-TOKEN'] = csrfToken;
          }
        } catch {}
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

      // Update auth store with new user and CSRF token
      try {
        const { default: useAuthStore } = await import('../store/useAuthStore.js');
        if (data.user) useAuthStore.getState().setUser(data.user);
        if (data.csrfToken) useAuthStore.getState().setCsrfToken(data.csrfToken);
      } catch {
        // Auth store not available — that's OK
      }

      // Process queued requests with the new token
      processQueue(null, newToken);

      // Small delay to allow cookie propagation before retrying
      await new Promise(resolve => setTimeout(resolve, 50));

      // Re-inject token and fire original request again
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
      // Clear old CSRF headers that might conflict and use fresh one from data
      delete originalRequest.headers['X-XSRF-TOKEN'];
      delete originalRequest.headers['x-xsrf-token'];
      if (data.csrfToken) {
        originalRequest.headers['X-XSRF-TOKEN'] = data.csrfToken;
      }

      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      
      // Check if this was a background sync request — don't force logout for those
      if (originalRequest.headers && originalRequest.headers['X-Background-Sync'] === 'true') {
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
