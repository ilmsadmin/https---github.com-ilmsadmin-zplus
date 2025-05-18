'use client';

import { 
  QueryClient, 
  UseQueryOptions, 
  UseQueryResult, 
  useMutation, 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import api from '../api/axios-instance';

// Create and export the QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Generic type for API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Custom hook for data fetching with React Query
 */
export function useFetch<T>(
  url: string,
  queryKey: any[],
  options?: UseQueryOptions<ApiResponse<T>, AxiosError>
): UseQueryResult<ApiResponse<T>, AxiosError> {
  return useQuery<ApiResponse<T>, AxiosError>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<ApiResponse<T>>(url);
      return response.data;
    },
    ...options,
  });
}

/**
 * Custom hook for fetching data with parameters
 */
export function useFetchWithParams<T, P extends Record<string, any>>(
  url: string,
  queryKey: any[],
  params?: P,
  options?: UseQueryOptions<ApiResponse<T>, AxiosError>
): UseQueryResult<ApiResponse<T>, AxiosError> {
  return useQuery<ApiResponse<T>, AxiosError>({
    queryKey: params ? [...queryKey, params] : queryKey,
    queryFn: async () => {
      const response = await api.get<ApiResponse<T>>(url, { params });
      return response.data;
    },
    ...options,
  });
}

/**
 * Custom hook for creating data
 */
export function useCreate<T, D>(url: string, options?: {
  onSuccess?: (data: ApiResponse<T>) => void;
  onError?: (error: AxiosError) => void;
}) {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<T>, AxiosError, D>({
    mutationFn: async (data: D) => {
      const response = await api.post<ApiResponse<T>>(url, data);
      return response.data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Custom hook for updating data
 */
export function useUpdate<T, D>(url: string, queryKey: any[], options?: {
  onSuccess?: (data: ApiResponse<T>) => void;
  onError?: (error: AxiosError) => void;
}) {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<T>, AxiosError, { id: string | number; data: D }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<ApiResponse<T>>(`${url}/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Custom hook for deleting data
 */
export function useDelete<T>(url: string, queryKey: any[], options?: {
  onSuccess?: (data: ApiResponse<T>) => void;
  onError?: (error: AxiosError) => void;
}) {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<T>, AxiosError, string | number>({
    mutationFn: async (id) => {
      const response = await api.delete<ApiResponse<T>>(`${url}/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Custom hook for handling pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

export function usePaginatedData<T>(
  url: string,
  queryKey: any[],
  params: PaginationParams,
  options?: UseQueryOptions<PaginatedResponse<T>, AxiosError>
) {
  return useQuery<PaginatedResponse<T>, AxiosError>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<T>>(url, { params });
      return response.data;
    },
    ...options,
  });
}
