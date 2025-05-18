'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOfflineStorage, OfflineStores } from './offline-storage';
import { usePWA } from '@/lib/hooks/use-pwa';

interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  cacheDuration?: number; // thời gian cache tính bằng giây
  offlineSupport?: boolean;
  cacheKey?: string; // key to identify cached data
}

export function useOfflineFetch<T>(
  url: string,
  options: UseFetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { isOnline } = usePWA();
  
  const {
    method = 'GET',
    body,
    headers = {},
    cacheDuration = 60 * 5, // 5 phút mặc định
    offlineSupport = true,
    cacheKey,
  } = options;

  // Tạo cache key dựa trên URL
  const storageKey = cacheKey || `${method}-${url}-cache`;

  const fetchData = useCallback(async (skipCache = false) => {
    setLoading(true);
    const storage = getOfflineStorage();
    const currentTime = new Date().getTime();
    
    try {
      // Kiểm tra cached data nếu là GET request
      if (!skipCache && method === 'GET' && offlineSupport) {
        const cachedData = await storage.getUserPreference<{
          data: T;
          timestamp: number;
        }>(storageKey);
        
        if (
          cachedData &&
          currentTime - cachedData.timestamp < cacheDuration * 1000
        ) {
          setData(cachedData.data);
          setLoading(false);
          return;
        }
      }
      
      // Nếu offline và không phải là GET request, queue lại để thực hiện sau
      if (!isOnline && method !== 'GET') {
        if (offlineSupport) {
          await storage.addToOutbox({
            url,
            method,
            headers,
            body,
          });
          
          setError(new Error('You are offline. Request queued for later.'));
        } else {
          setError(new Error('You are offline. This operation requires internet connection.'));
        }
        setLoading(false);
        return;
      }
      
      // Thực hiện network request nếu online
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      
      // Cache kết quả nếu là GET request
      if (method === 'GET' && offlineSupport) {
        await storage.setUserPreference(storageKey, {
          data: result,
          timestamp: currentTime,
        });
      }
      
    } catch (err) {
      // Nếu offline và có offline support, thử lấy cached data
      if (!isOnline && offlineSupport && method === 'GET') {
        const cachedData = await storage.getUserPreference<{
          data: T;
          timestamp: number;
        }>(storageKey);
        
        if (cachedData) {
          setData(cachedData.data);
          setError(new Error('Using cached data while offline.'));
        } else {
          setError(new Error('No cached data available offline.'));
        }
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  }, [url, method, body, headers, cacheDuration, offlineSupport, isOnline, storageKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xử lý khi online lại
  useEffect(() => {
    if (isOnline) {
      const storage = getOfflineStorage();
      
      // Xử lý outbox queue
      const processQueue = async () => {
        try {
          await storage.processOutbox();
          
          // Refresh data nếu là GET request
          if (method === 'GET') {
            fetchData(true); // Skip cache khi refresh
          }
        } catch (error) {
          console.error('Error processing offline queue:', error);
        }
      };
      
      processQueue();
    }
  }, [isOnline, fetchData, method]);

  // Thêm method để reload data
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, error, loading, refetch };
}
