import { NextIntlClientProvider } from 'next-intl';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { messages } from './messages';
import { RTLProvider } from '@/components/i18n/RTLProvider';

/**
 * Renders a component with internationalization support for testing
 * 
 * @param ui The component to render
 * @param locale The locale to use for the test
 * @param options Additional render options
 * @returns The rendered component with testing utilities
 */
export function renderWithI18n(
  ui: ReactElement,
  locale: string = 'en',
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const isRtl = ['ar', 'he'].includes(locale);
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages[locale] || {}}>
        <RTLProvider locale={locale}>
          {children}
        </RTLProvider>
      </NextIntlClientProvider>
    );
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Helper function to test a component with multiple locales
 * 
 * @param ui The component to render
 * @param locales Array of locales to test
 * @param options Additional render options
 * @returns An object with each locale's render result
 */
export function renderWithMultipleLocales(
  ui: ReactElement,
  locales: string[] = ['en', 'vi', 'zh', 'ja', 'ar', 'he'],
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const results: Record<string, ReturnType<typeof rtlRender>> = {};
  
  for (const locale of locales) {
    results[locale] = renderWithI18n(ui, locale, options);
  }
  
  return results;
}

/**
 * Creates a mock tenant with i18n settings for testing
 * 
 * @param overrides Custom tenant i18n settings
 * @returns A mock tenant object with i18n settings
 */
export function createMockTenantWithI18n(overrides: Record<string, any> = {}) {
  return {
    id: 'test-tenant',
    name: 'Test Tenant',
    defaultLocale: 'en',
    supportedLocales: ['en', 'vi'],
    customTranslations: {},
    ...overrides
  };
}
