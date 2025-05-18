import { PropsWithChildren, useEffect, useState } from 'react';
import { useRouter, usePathname } from './navigation';
import { isRtl, Locale, locales } from './config';
import { messages } from './messages';
import { NextIntlClientProvider } from 'next-intl';

interface I18nProviderProps extends PropsWithChildren {
  locale: Locale;
  tenantDefaultLocale?: Locale;
}

export function I18nProvider({
  children,
  locale,
  tenantDefaultLocale,
}: I18nProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [rtlDirection, setRtlDirection] = useState<'ltr' | 'rtl'>(
    isRtl(locale) ? 'rtl' : 'ltr'
  );
  // Apply RTL or LTR to document
  useEffect(() => {
    const direction = isRtl(locale) ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    setRtlDirection(direction);
  }, [locale]);

  // Save user locale preference to cookie
  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, [locale]);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale] || {}}
      formats={{
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }
        },
        number: {
          currency: {
            style: 'currency',
            currency: 'USD',
          }
        }
      }}
      onError={(error: any) => {
        // In development, log missing translations
        if (process.env.NODE_ENV === 'development') {
          console.warn(error);
        }
      }}
      timeZone="Asia/Ho_Chi_Minh" // Default timezone, can be overridden by tenant settings
    >
      {children}
    </NextIntlClientProvider>
  );
}

// Hook to switch locale
export function useLocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Save in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Extract the current locale from the URL if any
    const segments = pathname.split('/');
    const hasLocalePrefix = locales.includes(segments[1] as Locale);

    if (hasLocalePrefix) {
      // Replace the locale segment
      segments[1] = newLocale;
    } else {
      // Insert the locale prefix
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join('/') || '/';
    router.replace(newPath);
  };

  return { switchLocale };
}
