// Jest setup file for i18n tests
import '@testing-library/jest-dom';
import 'jest-localstorage-mock';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/en',
  })),
  usePathname: jest.fn(() => '/en'),
  useParams: jest.fn(() => ({ locale: 'en' })),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => (key, params = {}) => {
    const keys = key.split('.');
    const fullKey = namespace ? `${namespace}.${key}` : key;
    // Return a formatted string that makes it clear what's being rendered
    return `[${fullKey}${Object.keys(params).length ? ` with ${JSON.stringify(params)}` : ''}]`;
  }),
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn((date, options) => `[Formatted date: ${date.toISOString()}]`),
    number: jest.fn((num, options) => `[Formatted number: ${num}]`),
    relativeTime: jest.fn((value, unit, options) => `[Relative time: ${value} ${unit}]`),
  })),
  useLocale: jest.fn(() => 'en'),
  useTimeZone: jest.fn(() => 'UTC'),
}));

// Mock RTL context
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useLayoutEffect: originalReact.useEffect,
  };
});
