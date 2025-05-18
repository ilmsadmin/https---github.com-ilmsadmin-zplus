'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/hooks/useTenant';
import { createLocalizedPathname } from '@/lib/i18n/navigation';

interface I18nContextType {
  currentLocale: string;
  supportedLocales: string[];
  tenantLocales: string[];
  defaultLocale: string;
  tenantDefaultLocale: string;
  isRtl: boolean;
  changeLocale: (locale: string) => void;
  getLocalizedPath: (pathname: string, locale?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Provider component for handling internationalization with tenant context
 */
export function I18nContextProvider({ children }: { children: ReactNode }) {
  const currentLocale = useLocale();
  const router = useRouter();
  const { tenant } = useTenant();
  
  // System-supported locales
  const supportedLocales = ['en', 'vi', 'zh', 'ja', 'ar', 'he'];
  
  // Default locale for the system
  const defaultLocale = 'en';
  
  // Tenant-specific locales
  const tenantLocales = tenant?.supportedLocales || [defaultLocale];
  
  // Tenant-specific default locale
  const tenantDefaultLocale = tenant?.defaultLocale || defaultLocale;
  
  // Determine if the current locale is right-to-left
  const isRtl = ['ar', 'he'].includes(currentLocale);
  
  /**
   * Change the application locale
   * @param locale The locale to change to
   */
  const changeLocale = (locale: string) => {
    if (supportedLocales.includes(locale)) {
      const currentPathname = window.location.pathname;
      const segments = currentPathname.split('/');
      
      // Remove the current locale segment
      segments.shift();
      if (supportedLocales.includes(segments[0])) {
        segments.shift();
      }
      
      // Create new path with the selected locale
      const newPathname = `/${locale}${segments.length ? `/${segments.join('/')}` : ''}`;
      router.push(newPathname);
    }
  };
  
  /**
   * Get a localized pathname
   * @param pathname The pathname to localize
   * @param locale Optional locale to use (defaults to current)
   * @returns The localized pathname
   */
  const getLocalizedPath = (pathname: string, locale?: string) => {
    return createLocalizedPathname(pathname, locale || currentLocale);
  };
  
  // Context value
  const value: I18nContextType = {
    currentLocale,
    supportedLocales,
    tenantLocales,
    defaultLocale,
    tenantDefaultLocale,
    isRtl,
    changeLocale,
    getLocalizedPath,
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access the i18n context
 * @returns The i18n context value
 */
export function useI18n() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nContextProvider');
  }
  
  return context;
}
