import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (handles token refreshes)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('[AXIOS] Access token expired. Attempting token rotation...');
        // Request token refresh
        const response = await axios.post(
          'http://localhost:5001/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        if (response.data && response.data.success) {
          const { accessToken } = response.data.data;
          console.log('[AXIOS] Token rotation successful.');
          
          // Save new token
          localStorage.setItem('accessToken', accessToken);
          
          // Update original request auth header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[AXIOS] Token rotation failed. Logging out...', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Force redirect to login page if we are in browser context
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
