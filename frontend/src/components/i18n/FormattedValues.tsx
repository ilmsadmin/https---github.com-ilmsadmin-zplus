'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatDate, formatCurrency, formatNumber } from '@/lib/i18n/formatting';
import { Locale } from '@/lib/i18n/config';

interface FormattedDateProps {
  date: Date | string | number;
  locale: Locale;
  className?: string;
}

export function FormattedDate({ date, locale, className = '' }: FormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  
  useEffect(() => {
    setFormattedDate(formatDate(date, locale));
  }, [date, locale]);
  
  return <span className={className}>{formattedDate}</span>;
}

interface FormattedCurrencyProps {
  amount: number;
  locale: Locale;
  currency?: string;
  className?: string;
}

export function FormattedCurrency({ 
  amount, 
  locale,
  currency,
  className = ''
}: FormattedCurrencyProps) {
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  
  useEffect(() => {
    setFormattedAmount(formatCurrency(amount, locale, currency));
  }, [amount, locale, currency]);
  
  return <span className={className}>{formattedAmount}</span>;
}

interface FormattedNumberProps {
  value: number;
  locale: Locale;
  options?: Intl.NumberFormatOptions;
  className?: string;
}

export function FormattedNumber({ 
  value, 
  locale,
  options,
  className = ''
}: FormattedNumberProps) {
  const [formattedValue, setFormattedValue] = useState<string>('');
  
  useEffect(() => {
    setFormattedValue(formatNumber(value, locale, options));
  }, [value, locale, options]);
  
  return <span className={className}>{formattedValue}</span>;
}

interface PluralMessageProps {
  count: number;
  singular: string;
  plural: string;
  locale: Locale;
  values?: Record<string, React.ReactNode>;
  className?: string;
}

export function PluralMessage({
  count,
  singular,
  plural,
  locale,
  values = {},
  className = ''
}: PluralMessageProps) {
  const t = useTranslations();
  
  // Use next-intl's built-in plural formatting
  const message = count === 1 ? singular : plural;
  
  return (
    <span className={className}>
      {t(message, { count, ...values })}
    </span>
  );
}
