'use client';

import { ReactNode, useEffect } from 'react';
import { isRtl, locales } from '@/lib/i18n/config';

interface RTLProviderProps {
  children: ReactNode;
  locale: string;
}

/**
 * A component that handles RTL layout direction based on the current locale
 */
export function RTLProvider({ children, locale }: RTLProviderProps) {
  useEffect(() => {
    // Check if it's a valid locale
    const isValidLocale = locales.includes(locale as any);
    const validLocale = isValidLocale ? locale : 'en';
    
    // Set direction attribute on html element
    const direction = isRtl(validLocale as any) ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = validLocale;
    
    // Add a class to the body for additional RTL styling if needed
    if (isRtl(validLocale as any)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Apply RTL-specific Tailwind class for the proper text alignment and mirroring
    if (isRtl(validLocale as any)) {
      document.body.classList.add('tw-flip');
    } else {
      document.body.classList.remove('tw-flip');
    }
    
    return () => {
      // Cleanup
      document.body.classList.remove('rtl');
      document.body.classList.remove('tw-flip');
    };
  }, [locale]);
  
  // RTL requires specific CSS adjustments for:
  // 1. Text alignment (right for RTL, left for LTR)
  // 2. Flow direction (right-to-left vs left-to-right)
  // 3. Mirroring certain UI elements
  
  return <>{children}</>;
}
