import { locales, Locale } from './config';

// Map to hold already loaded messages
const loadedMessages: Record<string, Record<string, Record<string, string>>> = {};

/**
 * Dynamically loads translation messages for a specific locale and namespace
 * @param locale The locale to load
 * @param namespace Optional namespace (defaults to 'common')
 * @returns Promise with the loaded messages
 */
export async function loadMessages(locale: string, namespace: string = 'common') {
  // Validate locale
  if (!locales.includes(locale as any)) {
    console.warn(`Invalid locale: ${locale}. Falling back to 'en'.`);
    locale = 'en';
  }

  // Create cache key
  const cacheKey = `${locale}-${namespace}`;

  // If already loaded, return from cache
  if (loadedMessages[cacheKey]) {
    return loadedMessages[cacheKey];
  }

  try {
    // Dynamically import the messages
    const messages = await import(`../../messages/${locale}/${namespace}.json`);
    
    // Store in cache
    loadedMessages[cacheKey] = messages.default || messages;
    
    return loadedMessages[cacheKey];
  } catch (error) {
    console.error(`Failed to load messages for ${locale}/${namespace}:`, error);
    
    // Fallback to English if available
    if (locale !== 'en') {
      return loadMessages('en', namespace);
    }
    
    // Return empty object as last resort
    return {};
  }
}

/**
 * Preloads translation messages for specific locales and namespaces
 * @param locales Array of locales to preload
 * @param namespaces Array of namespaces to preload
 */
export async function preloadMessages(
  localesToLoad: string[] = ['en'],
  namespaces: string[] = ['common']
) {
  const loadPromises: Promise<any>[] = [];

  for (const locale of localesToLoad) {
    for (const namespace of namespaces) {
      loadPromises.push(loadMessages(locale, namespace));
    }
  }

  await Promise.all(loadPromises);
}

/**
 * Gets all loaded messages for a specific locale
 * @param locale The locale to get messages for
 * @returns All loaded messages for the locale
 */
export function getLoadedMessages(locale: string) {
  const messages: Record<string, any> = {};
  
  Object.keys(loadedMessages).forEach(key => {
    if (key.startsWith(`${locale}-`)) {
      const namespace = key.split('-')[1];
      messages[namespace] = loadedMessages[key];
    }
  });
  
  return messages;
}
