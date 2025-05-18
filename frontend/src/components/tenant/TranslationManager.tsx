'use client';

import { useState, useEffect } from 'react';
import { Locale, locales, localeNames } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';

interface TranslationKey {
  key: string;
  path: string;
  defaultValue: string;
}

interface TranslationManagerProps {
  tenantId: string;
  locale: Locale;
  adminOnly?: boolean;
}

export default function TranslationManager({
  tenantId,
  locale,
  adminOnly = true,
}: TranslationManagerProps) {
  const t = useTranslations('common');
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [customTranslations, setCustomTranslations] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch translation keys and custom translations
  useEffect(() => {
    async function fetchTranslationData() {
      setIsLoading(true);
      try {
        // In a real implementation, these would come from an API
        // Example: const response = await fetch(`/api/tenants/${tenantId}/translations?locale=${currentLocale}`);
        
        // Mock data for demonstration
        // These would be all the translatable keys in the system
        const mockTranslationKeys: TranslationKey[] = [
          { key: 'welcome', path: 'common.welcome', defaultValue: 'Welcome to Multi-Tenant System' },
          { key: 'dashboard', path: 'common.dashboard', defaultValue: 'Dashboard' },
          { key: 'settings', path: 'common.settings', defaultValue: 'Settings' },
          { key: 'users', path: 'common.users', defaultValue: 'Users' },
          { key: 'login', path: 'common.login', defaultValue: 'Login' },
          { key: 'logout', path: 'common.logout', defaultValue: 'Logout' },
          // Add more translation keys as needed
        ];
        
        // Mock tenant-specific custom translations
        const mockCustomTranslations: Record<string, string> = {
          'common.welcome': 'Welcome to ' + tenantId + ' Dashboard',
          'common.dashboard': 'Control Center',
        };
        
        setTranslationKeys(mockTranslationKeys);
        setCustomTranslations(mockCustomTranslations);
      } catch (error) {
        console.error('Failed to fetch translation data:', error);
        setErrorMessage('Failed to load translation data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTranslationData();
  }, [tenantId, currentLocale]);

  // Handle save translations
  const handleSaveTranslations = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // In a real implementation, this would be an API call
      // Example: await fetch(`/api/tenants/${tenantId}/translations/${currentLocale}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ translations: customTranslations }),
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Translations saved successfully');
    } catch (error) {
      console.error('Failed to save translations:', error);
      setErrorMessage('Failed to save translations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle translation update
  const handleTranslationChange = (path: string, value: string) => {
    setCustomTranslations(prev => ({
      ...prev,
      [path]: value,
    }));
  };

  // Handle locale change
  const handleLocaleChange = (newLocale: Locale) => {
    setCurrentLocale(newLocale);
  };

  // Filter translations based on search term
  const filteredTranslationKeys = translationKeys.filter(item => 
    item.path.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.defaultValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customTranslations[item.path] && customTranslations[item.path].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!adminOnly) {
    return <div>Access denied. Only tenant administrators can manage translations.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('translation_management')}</h1>
      
      {/* Language selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('select_language')}
        </label>
        <div className="flex flex-wrap gap-2">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`px-4 py-2 rounded-md text-sm ${
                currentLocale === loc
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {localeNames[loc]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('search_translations')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md dark:bg-green-800 dark:text-green-100">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md dark:bg-red-800 dark:text-red-100">
          {errorMessage}
        </div>
      )}
      
      {/* Translations table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    {t('translation_key')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    {t('default_value')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    {t('custom_value')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {filteredTranslationKeys.map((item) => (
                  <tr key={item.path}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.defaultValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <input
                        type="text"
                        value={customTranslations[item.path] || ''}
                        onChange={(e) => handleTranslationChange(item.path, e.target.value)}
                        placeholder={item.defaultValue}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveTranslations}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t('saving') : t('save_translations')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
