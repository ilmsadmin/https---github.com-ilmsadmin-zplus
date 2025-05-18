import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

// Định nghĩa routing config
const routing = {
  locales,
  defaultLocale,
  localePrefix: 'always' as const
};

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

/**
 * Creates a localized pathname by replacing the locale segment
 */
export function createLocalizedPathname(pathname: string, locale: string): string {
  // If pathname already has a locale segment, replace it
  const segments = pathname.split('/');
  if (segments.length > 1 && locales.includes(segments[1] as any)) {
    segments[1] = locale;
    return segments.join('/');
  }
  
  // Otherwise, add the locale segment at the beginning
  return `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
