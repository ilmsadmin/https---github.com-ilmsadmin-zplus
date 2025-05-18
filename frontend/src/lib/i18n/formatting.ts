import { localeMetadata, Locale } from './config';

/**
 * Format a date based on the current locale
 * @param date The date to format
 * @param locale The locale to use for formatting
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, locale: Locale): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const metadata = localeMetadata[locale];
  
  // Create format based on locale metadata
  let options: Intl.DateTimeFormatOptions = {};
  
  // Use different formats for different locales
  if (metadata.dateFormat === 'DD/MM/YYYY') {
    options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  } else if (metadata.dateFormat === 'MM/DD/YYYY') {
    options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  } else if (metadata.dateFormat === 'YYYY/MM/DD') {
    options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a time based on the current locale
 * @param date The date/time to format
 * @param locale The locale to use for formatting
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number, locale: Locale): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const metadata = localeMetadata[locale];
  
  // Create options based on locale metadata
  let options: Intl.DateTimeFormatOptions = {};
  
  if (metadata.timeFormat === 'HH:mm') {
    options = { hour: '2-digit', minute: '2-digit', hour12: false };
  } else if (metadata.timeFormat === 'h:mm A') {
    options = { hour: 'numeric', minute: '2-digit', hour12: true };
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a number based on the current locale
 * @param num The number to format
 * @param locale The locale to use for formatting
 * @param options Optional Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  num: number, 
  locale: Locale, 
  options?: Intl.NumberFormatOptions
): string {
  if (num === null || num === undefined) return '';
  
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format a currency value based on the current locale
 * @param amount The amount to format
 * @param locale The locale to use for formatting
 * @param customCurrency Optional custom currency code to override default
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  locale: Locale, 
  customCurrency?: string
): string {
  if (amount === null || amount === undefined) return '';
  
  const metadata = localeMetadata[locale];
  const currencyCode = customCurrency || metadata.currency.code;
  
  // Format the amount
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return formatted;
}

/**
 * Format a relative time (e.g., "2 days ago")
 * @param date The date to format relative to now
 * @param locale The locale to use for formatting
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string | number, locale: Locale): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHour = Math.floor(diffInMin / 60);
  const diffInDay = Math.floor(diffInHour / 24);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffInSec < 60) {
    return rtf.format(-diffInSec, 'second');
  } else if (diffInMin < 60) {
    return rtf.format(-diffInMin, 'minute');
  } else if (diffInHour < 24) {
    return rtf.format(-diffInHour, 'hour');
  } else if (diffInDay < 30) {
    return rtf.format(-diffInDay, 'day');
  } else {
    // For older dates, return formatted date
    return formatDate(dateObj, locale);
  }
}

/**
 * Helper to handle pluralization with proper grammatical rules per locale
 * @param count The count to determine plural form
 * @param singular The singular form
 * @param plural The plural form for English/default
 * @param locale The locale
 * @param forms Object containing locale-specific plural forms if needed
 * @returns The appropriate plural form for the locale and count
 */
export function getPlural(
  count: number,
  singular: string,
  plural: string,
  locale: Locale,
  forms?: Partial<Record<Locale, string[]>>
): string {
  // If we have custom forms for this locale, use them
  if (forms && forms[locale]) {
    const localeForms = forms[locale]!;
    
    // Different languages have different plural rules
    if (locale === 'ar') {
      // Arabic has 6 plural forms, simplified here to 3
      if (count === 0) return localeForms[0] || singular;
      if (count === 1) return localeForms[1] || singular;
      if (count === 2) return localeForms[2] || plural;
      if (count >= 3 && count <= 10) return localeForms[3] || plural;
      return localeForms[4] || plural;
    }
    
    if (locale === 'zh' || locale === 'ja') {
      // Chinese and Japanese don't typically change for plurals
      return localeForms[0] || singular;
    }
    
    // For other languages with simpler rules
    return count === 1 ? singular : plural;
  }
  
  // Default English-style pluralization
  return count === 1 ? singular : plural;
}
