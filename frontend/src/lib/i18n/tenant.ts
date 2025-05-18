import { Locale } from './config';

interface TenantI18nSettings {
  defaultLocale: Locale;
  enabledLocales: Locale[];
  customTranslations?: Record<Locale, Record<string, any>>;
  rtlSupport: boolean;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
}

// Default settings for all tenants
export const defaultTenantI18nSettings: TenantI18nSettings = {
  defaultLocale: 'vi',
  enabledLocales: ['vi', 'en'],
  rtlSupport: false,
  timezone: 'Asia/Ho_Chi_Minh',
};

// Function to retrieve tenant-specific i18n settings
export async function getTenantI18nSettings(tenantId: string): Promise<TenantI18nSettings> {
  try {
    // In a real implementation, this would fetch from an API or database
    // For now, we'll return mock data based on tenant ID
    
    // Example: Special settings for tenant1
    if (tenantId === 'tenant1') {
      return {
        ...defaultTenantI18nSettings,
        enabledLocales: ['vi', 'en', 'zh'],
        rtlSupport: false,
      };
    }
    
    // Example: Special settings for tenant with Arabic/Hebrew support
    if (tenantId === 'international-tenant') {
      return {
        defaultLocale: 'en',
        enabledLocales: ['en', 'ar', 'he'],
        rtlSupport: true,
        timezone: 'UTC',
      };
    }
    
    // Default settings for other tenants
    return defaultTenantI18nSettings;
  } catch (error) {
    console.error('Failed to load tenant i18n settings:', error);
    return defaultTenantI18nSettings;
  }
}

// Function to retrieve tenant-specific custom translations
export async function getTenantCustomTranslations(
  tenantId: string,
  locale: Locale
): Promise<Record<string, any>> {
  try {
    // In a real implementation, this would fetch from an API or database
    // For now, we'll return mock data based on tenant ID
    
    // Example: Special translations for tenant1
    if (tenantId === 'tenant1' && locale === 'vi') {
      return {
        tenant: {
          customField1: 'Giá trị tùy chỉnh 1',
          customField2: 'Giá trị tùy chỉnh 2',
        },
      };
    }
    
    if (tenantId === 'tenant1' && locale === 'en') {
      return {
        tenant: {
          customField1: 'Custom Value 1',
          customField2: 'Custom Value 2',
        },
      };
    }
    
    // Default: no custom translations
    return {};
  } catch (error) {
    console.error('Failed to load tenant custom translations:', error);
    return {};
  }
}
