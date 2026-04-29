import axios from 'axios';

const isDev = import.meta.env.DEV;

const apiClient = axios.create({
  baseURL: isDev ? 'http://localhost:3000/api' : '/api',
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// ─── Response Interceptor ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;

    // Auth expired → redirect to login
    if (status === 401) {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        console.warn('[API] Session expired, redirecting to login');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Rate limited
    if (status === 429) {
      console.warn('[API] Rate limited:', message);
    }

    // Server error
    if (status >= 500) {
      console.error('[API] Server error:', status, message);
    }

    // Network error / timeout
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
      error.message = 'Koneksi timeout. Cek internet Anda.';
    }

    if (!error.response && error.message === 'Network Error') {
      error.message = 'Tidak ada koneksi internet.';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
