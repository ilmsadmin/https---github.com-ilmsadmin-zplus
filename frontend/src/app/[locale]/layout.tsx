import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { locales } from '@/lib/i18n/config';
import { messages } from '@/lib/i18n/messages';
import { getTenantI18nSettings, getTenantCustomTranslations } from '@/lib/i18n/tenant';
import { I18nContextProvider } from '@/lib/i18n/context';
import { RTLProvider } from '@/components/i18n/RTLProvider';
import LocaleChangeLoader from '@/components/i18n/LocaleChangeLoader';

// This is a Server Component that will be rendered for each locale
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // Validate that the locale exists
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get tenant ID from cookies or headers (in a real implementation)
  // For demonstration, we'll use a mock tenant ID
  const tenantId = 'tenant1';

  // Get tenant-specific settings
  const tenantSettings = await getTenantI18nSettings(tenantId);
  
  // If locale is not enabled for this tenant, redirect to default locale
  if (!tenantSettings.enabledLocales.includes(locale as any)) {
    notFound();
  }

  // Get tenant-specific custom translations if any
  const customTranslations = await getTenantCustomTranslations(tenantId, locale as any);

  // Merge default translations with tenant-specific ones
  const mergedMessages = {
    ...messages[locale as any],
    ...customTranslations,
  };  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={mergedMessages}
      timeZone={tenantSettings.timezone}
      now={new Date()}
      formats={{
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          },
        },
      }}
    >
      <I18nContextProvider>
        <RTLProvider locale={locale}>
          <LocaleChangeLoader />
          {children}
        </RTLProvider>
      </I18nContextProvider>
    </NextIntlClientProvider>
  );
}
