import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Locale } from '@/lib/i18n/config';

export default function LocalizedHome({
  params,
}: {
  params: { locale: Locale }
}) {
  // Get the locale from params
  const locale = params.locale;
  const t = useTranslations('common');
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-900 dark:border-b dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Multi-Tenant Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher currentLocale={locale} />
              <Link href={`/${locale}/login`}>
                <Button variant="ghost">{t('login')}</Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button>{t('register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <main>
        <div className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0">
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                {t('welcome')}
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Build, deploy, and scale your SaaS applications with our comprehensive multi-tenant platform. 
                Secure, performant, and highly customizable.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href={`/${locale}/register`}>
                  <Button size="lg">{t('register')}</Button>
                </Link>
                <Link href={`/${locale}/login`} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  {t('login')} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
