'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { preloadMessages, loadMessages, getLoadedMessages } from '@/lib/i18n/dynamicMessages';
import { useLocale } from 'next-intl';

interface DynamicTranslationsProps {
  children: ReactNode;
  namespaces?: string[];
  fallback?: ReactNode;
}

/**
 * Component that dynamically loads translations for specific namespaces
 */
export default function DynamicTranslations({
  children,
  namespaces = ['common'],
  fallback = <div>Loading translations...</div>
}: DynamicTranslationsProps) {
  const locale = useLocale();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoaded(false);
      
      // Load all required namespaces
      const loadPromises = namespaces.map(ns => loadMessages(locale as string, ns));
      await Promise.all(loadPromises);
      
      setIsLoaded(true);
    };
    
    loadTranslations();
  }, [locale, namespaces]);

  if (!isLoaded) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Function to preload messages for the application
 * Call this function in your app initialization
 */
export function preloadAppMessages() {
  // Preload common messages for the default locale
  preloadMessages(['en'], ['common', 'auth']);
}

/**
 * Hook to dynamically load translations for a namespace
 * @param namespace The namespace to load
 * @returns Object indicating loading state and any error
 */
export function useDynamicTranslations(namespace: string) {
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await loadMessages(locale as string, namespace);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };
    
    load();
  }, [locale, namespace]);

  return { isLoading, error };
}
