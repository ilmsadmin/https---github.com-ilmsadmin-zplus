'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/axios-instance';
import { getTenantFromHostname } from '@/lib/utils';

// Define User type
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  permissions: string[];
  avatar?: string;
}

// Authentication context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

// Register data type
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  inviteToken?: string;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
});

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Validate token and get user data
        const response = await authApi.get('/me');
        setUser(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get tenant from hostname for multi-tenant authentication
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const tenant = getTenantFromHostname(hostname);
      
      // Call login API
      const response = await authApi.post('/login', {
        email,
        password,
        tenantId: tenant,
      });

      // Store tokens
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // Set user data
      setUser(response.data.user);
      
      // Redirect based on user role
      if (response.data.user.role === 'SYSTEM_ADMIN') {
        router.push('/system/dashboard');
      } else if (response.data.user.role === 'TENANT_ADMIN') {
        router.push('/tenant/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      // Get tenant from hostname if not provided
      if (!userData.tenantId) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const tenant = getTenantFromHostname(hostname);
        if (tenant) {
          userData.tenantId = tenant;
        }
      }
      
      const response = await authApi.post('/register', userData);
      
      // If registration directly logs in the user
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setUser(response.data.user);
      }
      
      router.push('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      await authApi.post('/forgot-password', { email });
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      await authApi.post('/reset-password', { token, password });
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
