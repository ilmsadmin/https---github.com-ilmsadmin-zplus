# Multi-Tenant Application Internationalization (i18n) Documentation

This document provides a comprehensive guide to the internationalization (i18n) system implemented in the multi-tenant application.

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Translation System](#translation-system)
4. [Locale-Specific Formatting](#locale-specific-formatting)
5. [RTL Support](#rtl-support)
6. [Tenant-Specific Configurations](#tenant-specific-configurations)
7. [Backend Internationalization](#backend-internationalization)
8. [Developer Guide](#developer-guide)
9. [Tenant Admin Guide](#tenant-admin-guide)
10. [Troubleshooting](#troubleshooting)

## Overview

The internationalization system in this application supports:
- Multiple languages (Vietnamese, English, Chinese, Japanese, Arabic, Hebrew)
- Locale-specific formatting for dates, times, numbers, and currencies
- Right-to-left (RTL) text direction for Arabic and Hebrew
- Tenant-specific internationalization settings
- Backend internationalization for emails and notifications

## System Architecture

The i18n system uses the following components:

- **Next-intl**: Core internationalization framework
- **Middleware**: Handles locale routing and detection
- **Context Provider**: Provides i18n capabilities to components
- **Dynamic Loading**: Improves performance by loading translations as needed
- **RTL Support**: Handles right-to-left languages
- **Formatting Utilities**: Format values according to locale

## Translation System

### Directory Structure

```
/frontend/src/messages/
  ├── en/
  │    ├── common.json
  │    ├── auth.json
  │    └── tenant.json
  ├── vi/
  │    ├── common.json
  │    ├── auth.json
  │    └── tenant.json
  └── ... (other locales)
```

### Namespaces

Translations are organized into namespaces:

- **common**: General UI elements, buttons, labels, etc.
- **auth**: Authentication-related messages
- **tenant**: Tenant-specific messages

### Using Translations in Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LoginButton() {
  const t = useTranslations('auth');
  
  return (
    <button>
      {t('login.button')}
    </button>
  );
}
```

### Dynamic Loading

For better performance, you can load translations dynamically:

```tsx
import DynamicTranslations from '@/components/i18n/DynamicTranslations';

function ProfilePage() {
  return (
    <DynamicTranslations namespaces={['profile']}>
      <Profile />
    </DynamicTranslations>
  );
}
```

## Locale-Specific Formatting

### Date and Time Formatting

```tsx
import { FormattedDate, FormattedTime } from '@/components/i18n/FormattedValues';

function EventDisplay({ event }) {
  return (
    <div>
      <FormattedDate value={event.date} />
      <FormattedTime value={event.time} />
    </div>
  );
}
```

### Number and Currency Formatting

```tsx
import { FormattedNumber, FormattedCurrency } from '@/components/i18n/FormattedValues';

function PriceDisplay({ product }) {
  return (
    <div>
      <FormattedNumber value={product.quantity} />
      <FormattedCurrency value={product.price} currency={product.currency} />
    </div>
  );
}
```

## RTL Support

RTL support is automatically enabled for Arabic and Hebrew locales.

### RTL Provider

The `RTLProvider` component automatically sets the correct text direction based on the locale:

```tsx
<RTLProvider locale={locale}>
  {children}
</RTLProvider>
```

### CSS Considerations

When writing CSS, consider RTL languages:

```css
/* Use logical properties */
padding-inline-start: 1rem;  /* Instead of padding-left */
padding-inline-end: 1rem;    /* Instead of padding-right */

/* Or use the RTL class */
.element {
  margin-left: 1rem;
}

.rtl .element {
  margin-left: 0;
  margin-right: 1rem;
}
```

## Tenant-Specific Configurations

Tenants can have their own i18n settings:

- Default locale
- Supported locales
- Custom translations

### Tenant Settings Interface

```tsx
interface TenantI18nSettings {
  defaultLocale: string;
  enabledLocales: string[];
  timezone: string;
  customTranslations: Record<string, Record<string, string>>;
}
```

### Using Tenant Settings

```tsx
import { useTenant } from '@/lib/hooks/useTenant';
import { useI18n } from '@/lib/i18n/context';

function LocalizedApp() {
  const { tenant } = useTenant();
  const { currentLocale, tenantDefaultLocale } = useI18n();
  
  // Use tenant-specific locale preferences
  // ...
}
```

## Backend Internationalization

### Email Templates

Email templates support internationalization:

```tsx
function sendWelcomeEmail(user, locale) {
  const messages = getBackendMessages(locale, 'email');
  
  const subject = messages.welcome.subject;
  const body = format(messages.welcome.body, {
    name: user.name,
    link: generateLoginLink(user)
  });
  
  return sendEmail(user.email, subject, body);
}
```

### Validation Messages

Validation messages are internationalized:

```tsx
function validateUserInput(data, locale) {
  const messages = getBackendMessages(locale, 'validation');
  
  const errors = {};
  
  if (!data.email) {
    errors.email = messages.required;
  }
  
  // More validation...
  
  return errors;
}
```

## Developer Guide

### Adding a New Locale

1. Create a new directory in `/frontend/src/messages/` for the locale (e.g., `de/` for German)
2. Copy the JSON files from the `en/` directory as a template
3. Translate the messages
4. Add the locale to the `locales` array in `config.ts`
5. Add metadata for the locale in `localeMetadata`

### Adding New Translations

1. Add the new key to the appropriate namespace in the English translations first
2. Add the same key to all other locale files
3. Run the `check-i18n.js` script to verify all translations exist

### Testing

Use the `renderWithI18n` utility to test components with i18n support:

```tsx
import { renderWithI18n } from '@/lib/i18n/testing';

test('renders login button correctly', () => {
  const { getByText } = renderWithI18n(<LoginButton />, 'en');
  expect(getByText('Log In')).toBeInTheDocument();
});
```

## Tenant Admin Guide

### Managing Translations

As a tenant administrator, you can:

1. Access the i18n settings page at `/tenant/settings/i18n`
2. Configure your default locale and enabled locales
3. Add custom translations for your tenant
4. Preview how the application looks in different locales

### Adding Custom Translations

1. Navigate to the Translation Manager
2. Select the namespace you want to customize
3. Add or edit translations
4. Save your changes

## Troubleshooting

### Missing Translations

If you see message keys instead of translated text (e.g., `auth.login.button`):

1. Check if the message key exists in the correct namespace
2. Verify that you're using the correct namespace in `useTranslations`
3. Run the `check-i18n.js` script to find missing translations

### RTL Issues

If RTL layouts don't display correctly:

1. Ensure the `RTLProvider` is wrapping your application
2. Check for hard-coded directional CSS properties
3. Use logical CSS properties where possible
4. Add specific RTL styles using the `.rtl` class

### Performance Issues

If translations are slowing down your application:

1. Use `DynamicTranslations` to load translations as needed
2. Consider code-splitting your application by locale
3. Preload common translations during application initialization
