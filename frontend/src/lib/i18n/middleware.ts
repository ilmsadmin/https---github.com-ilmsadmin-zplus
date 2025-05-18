// This file is deprecated as we are now using next-intl/middleware directly
// in the root middleware.ts file

// Keep this file as a placeholder for backward compatibility
// but its implementation is no longer used

import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './config';

/**
 * @deprecated Use next-intl/middleware directly in the root middleware.ts
 */
export function createI18nMiddleware() {
  console.warn('Using deprecated i18n middleware wrapper. Please update to use next-intl/middleware directly.');
  
  return async (request: NextRequest) => {
    return createMiddleware({
      locales,
      defaultLocale,
      localePrefix: 'always'
    })(request);
  };
}
