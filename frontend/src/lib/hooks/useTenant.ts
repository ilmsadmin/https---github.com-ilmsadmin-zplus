'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTenantFromHostname } from '@/lib/utils';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  settings: {
    i18n: {
      defaultLocale: string;
      enabledLocales: string[];
      timezone: string;
    };
    theme: {
      primaryColor: string;
      logo?: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: {
    locale?: string;
    theme?: 'light' | 'dark' | 'system';
  };
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
    useEffect(() => {    const fetchTenantData = async () => {
      try {
        setLoading(true);
        
        // Chỉ thực hiện các tác vụ browser khi ở client-side
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // Cache key để tránh fetch lại không cần thiết
        const cacheKey = window.location.hostname;
        const cachedData = sessionStorage.getItem(`tenant_data_${cacheKey}`);
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setTenant(parsed.tenant);
            setUser(parsed.user);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing cached tenant data:', e);
            // Tiếp tục với fetch mới nếu dữ liệu cache không hợp lệ
          }
        }
        
        // In a real implementation, this would fetch from an API
        const hostname = window.location.hostname;
        const tenantSlug = getTenantFromHostname(hostname);
        
        // Mock tenant data
        const mockTenant: Tenant = {
          id: 'tenant1',
          name: 'Demo Tenant',
          subdomain: tenantSlug || 'demo',
          settings: {
            i18n: {
              defaultLocale: 'vi',
              enabledLocales: ['en', 'vi'],
              timezone: 'Asia/Ho_Chi_Minh',
            },
            theme: {
              primaryColor: '#4f46e5',
            },
          },
        };
          // Mock user data
        const mockUser: User = {
          id: 'user1',
          name: 'Demo User',
          email: 'user@example.com',
          role: 'TENANT_ADMIN',
          preferences: {
            locale: typeof window !== 'undefined' ? localStorage.getItem('userLocale') || undefined : undefined,
            theme: typeof window !== 'undefined' 
              ? (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
              : 'system',
          },
        };
            // Cache the tenant and user data
        if (typeof window !== 'undefined') {
          const dataToCache = {
            tenant: mockTenant,
            user: mockUser
          };
          
          // Store in session storage for later use
          try {
            sessionStorage.setItem(
              `tenant_data_${window.location.hostname}`, 
              JSON.stringify(dataToCache)
            );
          } catch (e) {
            console.error('Error storing tenant data in cache:', e);
          }
        }
        
        setTenant(mockTenant);
        setUser(mockUser);
      } catch (error) {
        console.error('Error fetching tenant data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchTenantData();
    }
  }, [params]);
  
  // Return tenant and user data along with additional methods
  return { 
    tenant, 
    user, 
    loading,
      // Method to update user preferences
    updateUserPreferences: (preferences: Partial<User['preferences']>) => {
      if (!user || typeof window === 'undefined') return;
      
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences
        }
      };
      
      // Update local state
      setUser(updatedUser);
      
      // Update cache
      try {
        const cacheKey = `tenant_data_${window.location.hostname}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          parsed.user = updatedUser;
          sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
        
        // Lưu thiết lập locale vào localStorage nếu được cung cấp
        if (preferences.locale) {
          localStorage.setItem('userLocale', preferences.locale);
        }
        
        // Lưu thiết lập theme vào localStorage nếu được cung cấp
        if (preferences.theme) {
          localStorage.setItem('theme', preferences.theme);
        }
      } catch (e) {
        console.error('Error updating cached user preferences:', e);
      }
      
      // In a real app, we would also update the server
      console.log('User preferences updated:', preferences);
    }
  };
}
