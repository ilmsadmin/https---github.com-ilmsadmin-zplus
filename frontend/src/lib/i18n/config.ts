// Configuration for supported locales
export const locales = ['vi', 'en', 'zh', 'ja', 'ar', 'he'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'vi';

// Locale display names for language switcher
export const localeNames: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
  he: 'עברית',
};

// Right-to-left languages
export const rtlLocales: Locale[] = ['ar', 'he'];
export const isRtl = (locale: Locale): boolean => rtlLocales.includes(locale);

// Locale metadata
export interface LocaleMetadata {
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: {
    code: string;
    symbol: string;
    format: string; // '{symbol}{amount}' or '{amount}{symbol}'
  };
}

export const localeMetadata: Record<Locale, LocaleMetadata> = {
  vi: {
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: {
      code: 'VND',
      symbol: '₫',
      format: '{amount}{symbol}',
    },
  },
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: {
      code: 'USD',
      symbol: '$',
      format: '{symbol}{amount}',
    },
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: {
      code: 'CNY',
      symbol: '¥',
      format: '{symbol}{amount}',
    },
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: {
      code: 'JPY',
      symbol: '¥',
      format: '{symbol}{amount}',
    },
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: {
      code: 'AED',
      symbol: 'د.إ',
      format: '{amount}{symbol}',
    },
  },
  he: {
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: {
      code: 'ILS',
      symbol: '₪',
      format: '{symbol}{amount}',
    },
  },
};
