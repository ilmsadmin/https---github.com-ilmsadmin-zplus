import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromHostname } from './lib/utils';
import { createI18nMiddleware } from './lib/i18n/middleware';
import { defaultLocale, locales } from './lib/i18n/config';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const hostname = request.headers.get('host') || '';
  
  // Get tenant from hostname
  const tenant = getTenantFromHostname(hostname);
  
  // Check if the path has a valid locale
  const pathnameHasValidLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Redirect to default locale if no valid locale in path and not accessing the root path
  if (!pathnameHasValidLocale && pathname !== '/') {
    // Get locale from cookie or browser, defaulting to default locale
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    // Use detected locale or default to system default
    const locale = cookieLocale || defaultLocale;
    
    // Create new URL with locale prefix
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
        request.url
      )
    );
  }
    // Special case for localhost development with custom tenant
  const devTenant = url.searchParams.get('tenant');
  if (devTenant && (hostname.includes('localhost') || hostname.includes('127.0.0.1'))) {
    // Store the development tenant in a cookie
    const response = NextResponse.next();
    response.cookies.set('devTenant', devTenant);
    return response;
  }
  
  // For path-based routing in development
  if (pathname.startsWith(`/${defaultLocale}/tenant/`) && !tenant) {
    // Extract tenant from URL for development purposes
    const tenantFromPath = pathname.split('/')[3]; // /locale/tenant/tenantId
    if (tenantFromPath) {
      const response = NextResponse.next();
      response.cookies.set('devTenant', tenantFromPath);
      return response;
    }
  }
    // Check if accessing system routes
  if (pathname.includes('/system')) {
    // For system admin routes, verify if on the correct domain
    if (hostname !== 'admin.example.com' && 
        hostname !== 'system.example.com' && 
        !hostname.includes('localhost') && 
        !hostname.includes('127.0.0.1')) {
      // Redirect to login with locale
      const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }
  
  // Handle tenant-specific routes
  if (pathname.includes('/tenant') || pathname.includes('/dashboard')) {
    // If we have a tenant, add it to the request
    if (tenant) {
      const response = NextResponse.next();
      response.cookies.set('X-Tenant-ID', tenant);
      return response;
    } else if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // If not in development and no tenant, redirect to main page with locale
      const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}
