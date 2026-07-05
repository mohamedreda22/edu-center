import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// To be injected from AuthProvider to avoid circular dependency
let refreshAuthToken = null;
let getAccessToken = null;

export const injectAuthFunctions = (refreshFn, tokenFn) => {
  refreshAuthToken = refreshFn;
  getAccessToken = tokenFn;
};

// Request interceptor to attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not a retry and we have a refresh function
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshAuthToken
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
