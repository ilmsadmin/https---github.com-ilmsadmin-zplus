const { locales, defaultLocale } = require('./src/lib/i18n/config');

/**
 * @type {import('next-intl').NextIntlConfig}
 */
module.exports = {
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Các tùy chọn cấu hình khác có thể thêm vào đây
};
