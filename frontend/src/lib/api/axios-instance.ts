import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getTenantFromHostname } from '../utils';

// Create a custom axios instance
const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Get tenant from hostname
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const tenant = getTenantFromHostname(hostname);
      
      // Set Auth Header
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Set Tenant Header for tenant-specific requests
      if (tenant) {
        config.headers['X-Tenant-ID'] = tenant;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      
      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await axios.post('/api/auth/refresh-token', {
            refreshToken,
          });
          
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            }
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
      }
      
      // Handle other errors
      return Promise.reject(error);
    }
  );

  return instance;
};

// API clients for different services
export const authApi = createAxiosInstance(process.env.NEXT_PUBLIC_AUTH_API_URL || '/api/auth');
export const tenantApi = createAxiosInstance(process.env.NEXT_PUBLIC_TENANT_API_URL || '/api/tenant');
export const userApi = createAxiosInstance(process.env.NEXT_PUBLIC_USER_API_URL || '/api/user');
export const fileApi = createAxiosInstance(process.env.NEXT_PUBLIC_FILE_API_URL || '/api/file');

// Default API client
const api = createAxiosInstance(process.env.NEXT_PUBLIC_API_URL || '/api');
export default api;
