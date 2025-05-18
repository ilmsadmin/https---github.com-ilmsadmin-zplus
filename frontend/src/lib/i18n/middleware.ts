import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './config';

export function createI18nMiddleware() {
  const i18nMiddleware = createMiddleware({
    // List of supported locales
    locales,
    // Default locale
    defaultLocale,
    // Always include locale in path
    localePrefix: 'always',
    // Detect locale from cookies or headers as fallback
    localeDetection: true,
  });
  
  return async (request: NextRequest) => {
    // Try to get the locale from cookie first (user preference)
    const userPreferredLocale = request.cookies.get('NEXT_LOCALE')?.value;
    
    // If no cookie is set, continue with normal i18n middleware
    if (!userPreferredLocale) {
      return i18nMiddleware(request);
    }
    
    // Check if the URL already has a locale
    const pathname = request.nextUrl.pathname;
    
    // Regular expression to check if pathname starts with a locale
    const startsWithLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    
    // If URL already has a locale and it matches the cookie, no redirect needed
    if (startsWithLocale) {
      // Extract the current locale from the URL
      const currentLocale = pathname.split('/')[1];
      
      // If the current locale is the same as the preferred one, continue
      if (currentLocale === userPreferredLocale) {
        return i18nMiddleware(request);
      }
    }
    
    // Get path without locale prefix
    const pathWithoutLocale = startsWithLocale
      ? pathname.replace(/^\/[^/]+/, '')
      : pathname;
    
    // Build new URL with the user's preferred locale
    const newUrl = new URL(
      `/${userPreferredLocale}${pathWithoutLocale || '/'}`,
      request.url
    );
    
    // Copy all search params
    request.nextUrl.searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value);
    });
    
    // Redirect to the URL with the preferred locale
    return NextResponse.redirect(newUrl);
  };
}
