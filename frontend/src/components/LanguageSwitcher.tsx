'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { locales, localeNames, Locale } from '@/lib/i18n/config';
import { useLocaleSwitch } from '@/lib/i18n/provider';

interface LanguageSwitcherProps {
  className?: string;
  currentLocale: Locale;
}

export function LanguageSwitcher({
  className = '',
  currentLocale,
}: LanguageSwitcherProps) {
  const t = useTranslations('common');
  const { switchLocale } = useLocaleSwitch();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (locale: string) => {
    switchLocale(locale);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{localeNames[currentLocale as Locale]}</span>
        <svg
          className={`h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-900 dark:ring-gray-700">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  currentLocale === locale
                    ? 'bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-white'
                 