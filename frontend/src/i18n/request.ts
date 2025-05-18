import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  // Validate the locale
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  try {
    // Load messages for the requested locale
    const commonMessages = await import(`@/messages/${locale}/common.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
      // Add auth messages if they exist
    const authMessages = await import(`@/messages/${locale}/auth.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
    
    // Add home messages if they exist
    const homeMessages = await import(`@/messages/${locale}/home.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
    
    // Add UI component messages
    const uiMessages = await import(`@/messages/${locale}/ui.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
    
    // Add PWA messages
    const pwaMessages = await import(`@/messages/${locale}/pwa.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
    
    // Add tenant management messages
    const tenantMessages = await import(`@/messages/${locale}/tenant.json`)
      .then(module => module.default || module)
      .catch(() => ({}));
    
    return {
      locale, // Ensure locale is always returned
      messages: { 
        ...commonMessages, 
        ...authMessages, 
        ...homeMessages, 
        ...uiMessages, 
        ...pwaMessages, 
        ...tenantMessages 
      },
      timeZone: 'Asia/Ho_Chi_Minh', // This could be tenant-specific in a real application
      now: new Date(),
      formats: {
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          },
        },
      },
    };
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    
    // Fallback to default locale messages
    try {
      const commonMessages = await import(`@/messages/${defaultLocale}/common.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
        const authMessages = await import(`@/messages/${defaultLocale}/auth.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
      
      // Add home messages
      const homeMessages = await import(`@/messages/${defaultLocale}/home.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
      
      // Add UI component messages
      const uiMessages = await import(`@/messages/${defaultLocale}/ui.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
      
      // Add PWA messages
      const pwaMessages = await import(`@/messages/${defaultLocale}/pwa.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
      
      // Add tenant management messages
      const tenantMessages = await import(`@/messages/${defaultLocale}/tenant.json`)
        .then(module => module.default || module)
        .catch(() => ({}));
      
      return {
        messages: { 
          ...commonMessages, 
          ...authMessages, 
          ...homeMessages, 
          ...uiMessages, 
          ...pwaMessages, 
          ...tenantMessages 
        },
        timeZone: 'Asia/Ho_Chi_Minh',
        now: new Date(),
        formats: {
          dateTime: {
            short: {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          },
        },
      };
    } catch (fallbackError) {
      console.error(`Error loading fallback messages for locale ${defaultLocale}:`, fallbackError);
      return {
        messages: {},
        timeZone: 'Asia/Ho_Chi_Minh',
        now: new Date(),
        formats: {
          dateTime: {
            short: {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          },
        },
      };
    }
  }
});
