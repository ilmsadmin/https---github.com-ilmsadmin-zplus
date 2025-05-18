import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n/config';

export default async function Home() {
  try {
    // Add server timing to measure performance
    const startTime = Date.now();
    
    // Check for token to determine where to redirect
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const userRole = cookieStore.get('userRole')?.value;
    
    // Log performance metrics
    const endTime = Date.now();
    console.log(`Cookie retrieval took ${endTime - startTime}ms`);
    
    // First redirect to the default locale
    const basePath = `/${defaultLocale}`;
    
    // Then redirect to the appropriate dashboard if logged in
    if (token) {
      if (userRole === 'SYSTEM_ADMIN') {
        redirect(`${basePath}/system/dashboard`);
      } else {
        redirect(`${basePath}/tenant/dashboard`);
      }
    }
    
    // If not logged in, redirect to the login page with the locale
    redirect(`${basePath}/login`);
  } catch (error) {
    console.error('Error in Home component:', error);
    // Fallback redirect to the login page with the locale
    redirect(`/${defaultLocale}/login`);
  }
}
