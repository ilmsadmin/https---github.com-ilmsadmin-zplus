import { Locale } from './config';

// Define the basic structure of the messages
export const messages: Record<Locale, Record<string, any>> = {
  en: {},
  vi: {},
  zh: {},
  ja: {},
  ar: {},
  he: {},
};

// Dynamically load message files
// In a real implementation, you'd likely preload these during build
// or have a more sophisticated dynamic loading strategy
export async function loadMessages(locale: Locale): Promise<Record<string, any>> {
  try {
    // Try to load the common messages
    const commonMessages = await import(`@/messages/${locale}/common.json`).catch(() => ({}));
    
    // Try to load the auth messages
    const authMessages = await import(`@/messages/${locale}/auth.json`).catch(() => ({}));
    
    // Merge all message files
    return {
      ...commonMessages.default || commonMessages,
      ...authMessages.default || authMessages,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    return {};
  }
}