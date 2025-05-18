'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useTenant } from './useTenant';
import { TenantI18nIntegrationService, TenantI18nDbSettings } from '@/lib/i18n/tenantIntegration';

interface UseI18nSettingsResult {
  settings: TenantI18nDbSettings | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<TenantI18nDbSettings>) => Promise<boolean>;
  userLocale: string | null;
  setUserLocale: (locale: string) => Promise<boolean>;
}

/**
 * Hook for accessing and managing tenant i18n settings
 * @returns I18n settings state and functions
 */
export function useI18nSettings(): UseI18nSettingsResult {
  const locale = useLocale();
  const { tenant, user } = useTenant();
  const [settings, setSettings] = useState<TenantI18nDbSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userLocale, setUserLocaleState] = useState<string | null>(null);

  // Fetch tenant i18n settings
  useEffect(() => {
    if (!tenant?.id) return;

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const tenantSettings = await TenantI18nIntegrationService.getTenantI18nSettings(tenant.id);
        setSettings(tenantSettings);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching tenant i18n settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [tenant?.id]);

  // Fetch user's language preference
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserLocale = async () => {
      try {
        const preference = await TenantI18nIntegrationService.getUserLanguagePreference(user.id);
        setUserLocaleState(preference);
      } catch (err) {
        console.error('Error fetching user language preference:', err);
      }
    };

    fetchUserLocale();
  }, [user?.id]);

  /**
   * Update tenant i18n settings
   * @param newSettings The new settings to apply
   * @returns Promise indicating success
   */
  const updateSettings = async (newSettings: Partial<TenantI18nDbSettings>): Promise<boolean> => {
    if (!tenant?.id || !settings) {
      return false;
    }

    try {
      setIsLoading(true);
      const success = await TenantI18nIntegrationService.saveTenantI18nSettings(
        tenant.id,
        newSettings
      );

      if (success) {
        // Update local state
        setSettings({
          ...settings,
          ...newSettings,
          updatedAt: new Date(),
        });
      }

      return success;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating tenant i18n settings:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set the user's preferred locale
   * @param locale The locale to set
   * @returns Promise indicating success
   */
  const setUserLocale = async (locale: string): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    try {
      const success = await TenantI18nIntegrationService.saveUserLanguagePreference(
        user.id,
        locale
      );

      if (success) {
        setUserLocaleState(locale);
      }

      return success;
    } catch (err) {
      console.error('Error setting user locale:', err);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    userLocale,
    setUserLocale,
  };
}
