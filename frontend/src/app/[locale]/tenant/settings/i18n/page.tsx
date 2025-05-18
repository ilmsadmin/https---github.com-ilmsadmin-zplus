'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Locale, locales, localeNames, localeMetadata } from '@/lib/i18n/config';
import TranslationManager from '@/components/tenant/TranslationManager';
import { useI18nSettings } from '@/lib/hooks/useI18nSettings';
import { useTenant } from '@/lib/hooks/useTenant';

export default function TenantI18nSettings({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const t = useTranslations('common');
  const { tenant } = useTenant();
  const { 
    settings, 
    isLoading, 
    error, 
    updateSettings 
  } = useI18nSettings();
  
  const [enabledLocales, setEnabledLocales] = useState<string[]>(['en']);
  const [defaultLocale, setDefaultLocale] = useState<string>('en');
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<string>('HH:mm');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyFormat, setCurrencyFormat] = useState<string>('{symbol}{amount}');
  const [rtlEnabled, setRtlEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings) {
      setDefaultLocale(settings.defaultLocale);
      setEnabledLocales(settings.enabledLocales);
      setDateFormat(settings.dateFormat);
      setTimeFormat(settings.timeFormat);
      setTimezone(settings.timezone);
      setCurrencyCode(settings.currency.code);
      setCurrencySymbol(settings.currency.symbol);
      setCurrencyFormat(settings.currency.format);
      setRtlEnabled(settings.enabledLocales.some(locale => ['ar', 'he'].includes(locale)));
    }
  }, [settings]);
  
  // Handle locale toggle
  const handleLocaleToggle = (loc: string, checked: boolean) => {
    if (checked) {
      setEnabledLocales([...enabledLocales, loc]);
    } else {
      // Don't allow removing the default locale
      if (loc === defaultLocale) {
        return;
      }
      setEnabledLocales(enabledLocales.filter(l => l !== loc));
    }
  };
  
  // Handle default locale change
  const handleDefaultLocaleChange = (locale: string) => {
    setDefaultLocale(locale);
    
    // Ensure the default locale is enabled
    if (!enabledLocales.includes(locale)) {
      setEnabledLocales([...enabledLocales, locale]);
    }
  };
  
  // Handle RTL toggle
  const handleRtlToggle = (checked: boolean) => {
    setRtlEnabled(checked);
    
    // If enabling RTL, ensure at least one RTL language is enabled
    if (checked && !enabledLocales.some(locale => ['ar', 'he'].includes(locale))) {
      // Add Arabic by default
      setEnabledLocales([...enabledLocales, 'ar']);
    }
    
    // If disabling RTL, remove RTL languages
    if (!checked) {
      setEnabledLocales(enabledLocales.filter(locale => !['ar', 'he'].includes(locale)));
    }
  };
  
  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    
    try {
      const success = await updateSettings({
        defaultLocale,
        enabledLocales,
        dateFormat,
        timeFormat,
        timezone,
        currency: {
          code: currencyCode,
          symbol: currencySymbol,
          format: currencyFormat
        }
      });
      
      setSaveSuccess(success);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
      
      // Reset success message after a delay
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{t('error_loading_settings')}</div>
      </div>
    );
  }
    return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('internationalization_settings')}</h1>
      
      {saveSuccess !== null && (
        <div className={`mb-4 p-3 rounded ${saveSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {saveSuccess 
            ? t('settings_saved_successfully')
            : t('error_saving_settings')
          }
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Locale settings */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t('language_settings')}</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('default_language')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={defaultLocale}
              onChange={(e) => handleDefaultLocaleChange(e.target.value)}
            >
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {localeNames[loc as Locale]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('default_language_description')}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('enabled_languages')}
            </label>
            {locales.map((loc) => (
              <div key={loc} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`enable-${loc}`}
                  checked={enabledLocales.includes(loc)}
                  disabled={loc === defaultLocale} // Can't disable default locale
                  onChange={(e) => handleLocaleToggle(loc, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`enable-${loc}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {localeNames[loc as Locale]}
                </label>
              </div>
            ))}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('enable_rtl_support')}
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable-rtl"
                checked={rtlEnabled}
                onChange={(e) => handleRtlToggle(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enable-rtl" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {t('enable_rtl_languages')}
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('rtl_description')}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('date_format')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              <option value="MM-DD-YYYY">MM-DD-YYYY</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('time_format')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
            >
              <option value="HH:mm">24-hour (HH:mm)</option>
              <option value="h:mm A">12-hour (h:mm AM/PM)</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('timezone')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</option>
              <option value="Asia/Tokyo">Japan (GMT+9)</option>
              <option value="Asia/Shanghai">China (GMT+8)</option>
              <option value="America/New_York">Eastern Time (GMT-5)</option>
              <option value="Europe/London">London (GMT+0)</option>
              <option value="Asia/Dubai">Dubai (GMT+4)</option>
              <option value="Asia/Jerusalem">Jerusalem (GMT+2)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('currency')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t('currency_code')}
                </label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="USD"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t('currency_symbol')}
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="$"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t('currency_format')}
              </label>
              <select
                value={currencyFormat}
                onChange={(e) => setCurrencyFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="{symbol}{amount}">{t('symbol_before_amount')}</option>
                <option value="{amount}{symbol}">{t('symbol_after_amount')}</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isSaving ? t('saving') : t('save_settings')}
          </button>
        </div>
        
        {/* Translation management section */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <TranslationManager tenantId={tenant?.id || 'default'} locale={locale} />
        </div>
      </div>
    </div>
  );
}
