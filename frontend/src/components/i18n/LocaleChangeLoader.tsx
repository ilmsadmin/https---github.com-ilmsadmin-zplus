'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

interface LocaleChangeLoaderProps {
  /** Custom loading component to show during locale change */
  loadingComponent?: React.ReactNode;
  /** Minimum duration to show the loader in milliseconds */
  minDuration?: number;
}

/**
 * Component that displays a loading state during locale changes
 * This helps improve the perceived performance of locale switches
 */
export default function LocaleChangeLoader({
  loadingComponent = <DefaultLoader />,
  minDuration = 400
}: LocaleChangeLoaderProps) {
  const [isChangingLocale, setIsChangingLocale] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Store the current pathname and locale in session storage
  // to detect changes on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const previousPathname = sessionStorage.getItem('previousPathname');
      const previousLocale = sessionStorage.getItem('previousLocale');
      
      // If pathname is the same but locale is different, we're changing locale
      if (
        previousPathname && 
        previousLocale && 
        previousPathname.replace(`/${previousLocale}`, '') === pathname.replace(`/${locale}`, '') &&
        previousLocale !== locale
      ) {
        handleLocaleChange();
      }
      
      // Update stored values
      sessionStorage.setItem('previousPathname', pathname);
      sessionStorage.setItem('previousLocale', locale as string);
    }
  }, [pathname, locale]);

  // Handle locale change with minimum duration
  const handleLocaleChange = useCallback(() => {
    setIsChangingLocale(true);
    
    const startTime = Date.now();
    
    const timer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime >= minDuration) {
        setIsChangingLocale(false);
      } else {
        // Wait the remaining time
        setTimeout(() => {
          setIsChangingLocale(false);
        }, minDuration - elapsedTime);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [minDuration]);

  if (!isChangingLocale) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
      {loadingComponent}
    </div>
  );
}

// Default loader component
function DefaultLoader() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
        Changing language...
      </p>
    </div>
  );
}
