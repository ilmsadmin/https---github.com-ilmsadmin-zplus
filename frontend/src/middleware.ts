import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromHostname } from './lib/utils';

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
  const hostname = request.headers.get('host') || '';
  
  // Get tenant from hostname
  const tenant = getTenantFromHostname(hostname);
  
  // Special case for localhost development with custom tenant
  const devTenant = url.searchParams.get('tenant');
  if (devTenant && (hostname.includes('localhost') || hostname.includes('127.0.0.1'))) {
    // Store the development tenant in a cookie
    const response = NextResponse.next();
    response.cookies.set('devTenant', devTenant);
    return response;
  }
  
  // For path-based routing in development
  if (url.pathname.startsWith('/tenant/') && !tenant) {
    // Extract tenant from URL for development purposes
    const tenantFromPath = url.pathname.split('/')[2];
    if (tenantFromPath) {
      const response = NextResponse.next();
      response.cookies.set('devTenant', tenantFromPath);
      return response;
    }
  }
  
  // Check if accessing system routes
  if (url.pathname.startsWith('/system')) {
    // For system admin routes, verify if on the correct domain
    if (hostname !== 'admin.example.com' && 
        hostname !== 'system.example.com' && 
        !hostname.includes('localhost') && 
        !hostname.includes('127.0.0.1')) {
      // Redirect to login if not on the system domain
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Handle tenant-specific routes
  if (url.pathname.startsWith('/tenant') || url.pathname === '/dashboard') {
    // If we have a tenant, add it to the request
    if (tenant) {
      const response = NextResponse.next();
      response.cookies.set('X-Tenant-ID', tenant);
      return response;
    } else if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // If not in development and no tenant, redirect to main page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}
