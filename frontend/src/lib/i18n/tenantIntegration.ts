import { Locale, locales } from './config';

/**
 * Interface for tenant internationalization settings stored in the database
 */
export interface TenantI18nDbSettings {
  id: string;
  defaultLocale: string;
  enabledLocales: string[];
  customTranslations: Record<string, Record<string, string>>;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  currency: {
    code: string;
    symbol: string;
    format: string;
  };
  updatedAt: Date;
}

/**
 * Interface for user language preferences stored in the database
 */
export interface UserLanguagePreference {
  userId: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for integrating internationalization with tenant database settings
 */
export class TenantI18nIntegrationService {
  /**
   * Fetches tenant internationalization settings from the database
   * @param tenantId The tenant ID
   * @returns Promise with tenant i18n settings
   */
  static async getTenantI18nSettings(tenantId: string): Promise<TenantI18nDbSettings> {
    try {
      // In a real implementation, this would fetch from your API
      const response = await fetch(`/api/tenants/${tenantId}/settings/i18n`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tenant i18n settings: ${response.statusText}`);
      }
      
      const settings = await response.json();
      
      // Validate the settings
      return this.validateSettings(settings);
    } catch (error) {
      console.error('Error fetching tenant i18n settings:', error);
      
      // Return default settings if fetch fails
      return this.getDefaultSettings(tenantId);
    }
  }
  
  /**
   * Saves tenant internationalization settings to the database
   * @param tenantId The tenant ID
   * @param settings The settings to save
   * @returns Promise indicating success
   */
  static async saveTenantI18nSettings(
    tenantId: string, 
    settings: Partial<TenantI18nDbSettings>
  ): Promise<boolean> {
    try {
      // In a real implementation, this would save to your API
      const response = await fetch(`/api/tenants/${tenantId}/settings/i18n`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save tenant i18n settings: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving tenant i18n settings:', error);
      return false;
    }
  }
  
  /**
   * Saves a user's language preference
   * @param userId The user ID
   * @param locale The preferred locale
   * @returns Promise indicating success
   */
  static async saveUserLanguagePreference(userId: string, locale: string): Promise<boolean> {
    try {
      // Validate the locale
      if (!locales.includes(locale as any)) {
        throw new Error(`Invalid locale: ${locale}`);
      }
      
      // In a real implementation, this would save to your API
      const response = await fetch(`/api/users/${userId}/preferences/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save language preference: ${response.statusText}`);
      }
      
      // Store in localStorage for persistence between sessions
      localStorage.setItem('userLanguagePreference', locale);
      
      return true;
    } catch (error) {
      console.error('Error saving user language preference:', error);
      return false;
    }
  }
  
  /**
   * Gets a user's language preference
   * @param userId The user ID
   * @returns Promise with the user's preferred locale
   */
  static async getUserLanguagePreference(userId: string): Promise<string | null> {
    try {
      // Check localStorage first for performance
      const cachedPreference = localStorage.getItem('userLanguagePreference');
      if (cachedPreference) {
        return cachedPreference;
      }
      
      // In a real implementation, this would fetch from your API
      const response = await fetch(`/api/users/${userId}/preferences/language`);
      
      if (!response.ok) {
        // If 404, user has no preference yet
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch user language preference: ${response.statusText}`);
      }
      
      const preference = await response.json();
      
      // Cache in localStorage
      if (preference?.locale) {
        localStorage.setItem('userLanguagePreference', preference.locale);
      }
      
      return preference?.locale || null;
    } catch (error) {
      console.error('Error fetching user language preference:', error);
      return null;
    }
  }
  
  /**
   * Gets tenant-specific custom translations
   * @param tenantId The tenant ID
   * @param locale The locale
   * @returns Promise with tenant-specific translations
   */
  static async getTenantCustomTranslations(
    tenantId: string,
    locale: string
  ): Promise<Record<string, string>> {
    try {
      // In a real implementation, this would fetch from your API
      const response = await fetch(`/api/tenants/${tenantId}/translations/${locale}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tenant translations: ${response.statusText}`);
      }
      
      const translations = await response.json();
      return translations;
    } catch (error) {
      console.error('Error fetching tenant translations:', error);
      return {};
    }
  }
  
  /**
   * Validates tenant i18n settings and ensures all required fields exist
   * @param settings The settings to validate
   * @returns Validated settings with defaults applied where needed
   */
  private static validateSettings(settings: any): TenantI18nDbSettings {
    const defaultSettings = this.getDefaultSettings(settings.id || 'unknown');
    
    // Ensure required fields exist
    return {
      id: settings.id || defaultSettings.id,
      defaultLocale: this.validateLocale(settings.defaultLocale) || defaultSettings.defaultLocale,
      enabledLocales: this.validateEnabledLocales(settings.enabledLocales) || defaultSettings.enabledLocales,
      customTranslations: settings.customTranslations || defaultSettings.customTranslations,
      dateFormat: settings.dateFormat || defaultSettings.dateFormat,
      timeFormat: settings.timeFormat || defaultSettings.timeFormat,
      timezone: settings.timezone || defaultSettings.timezone,
      currency: {
        code: settings.currency?.code || defaultSettings.currency.code,
        symbol: settings.currency?.symbol || defaultSettings.currency.symbol,
        format: settings.currency?.format || defaultSettings.currency.format,
      },
      updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : new Date(),
    };
  }
  
  /**
   * Gets default tenant i18n settings
   * @param tenantId The tenant ID
   * @returns Default tenant i18n settings
   */
  private static getDefaultSettings(tenantId: string): TenantI18nDbSettings {
    return {
      id: tenantId,
      defaultLocale: 'en',
      enabledLocales: ['en'],
      customTranslations: {},
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      timezone: 'UTC',
      currency: {
        code: 'USD',
        symbol: '$',
        format: '{symbol}{amount}',
      },
      updatedAt: new Date(),
    };
  }
  
  /**
   * Validates a locale string
   * @param locale The locale to validate
   * @returns Valid locale or null
   */
  private static validateLocale(locale: string): string | null {
    return locales.includes(locale as any) ? locale : null;
  }
  
  /**
   * Validates enabled locales array
   * @param enabledLocales The locales to validate
   * @returns Valid locales array or null
   */
  private static validateEnabledLocales(enabledLocales: string[]): string[] | null {
    if (!Array.isArray(enabledLocales) || enabledLocales.length === 0) {
      return null;
    }
    
    // Filter to only include valid locales
    const validLocales = enabledLocales.filter(locale => 
      locales.includes(locale as any)
    );
    
    return validLocales.length > 0 ? validLocales : null;
  }
}
