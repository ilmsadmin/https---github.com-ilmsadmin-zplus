import { useTranslations } from 'next-intl';
import { Locale } from '@/lib/i18n/config';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function Login({
  params,
}: {
  params: { locale: Locale }
}) {
  const { locale } = params;
  const t = useTranslations('auth');
  const c = useTranslations('common');
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('loginTitle')}
            </h2>
          </div>
          <LanguageSwitcher currentLocale={locale} />
        </div>
        
        <form className="mt-8 space-y-6" action="#" method="POST">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {c('email')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                placeholder={c('email')}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {c('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                placeholder={c('password')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href={`/${locale}/forgot-password`} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                {c('forgotPassword')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {c('login')}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
          </span>
          <Link href={`/${locale}/register`} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            {c('register')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
