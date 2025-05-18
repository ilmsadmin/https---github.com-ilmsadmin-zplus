import { renderWithI18n, renderWithMultipleLocales } from '@/lib/i18n/testing';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FormattedNumber, FormattedDate, FormattedTime, FormattedCurrency } from '@/components/i18n/FormattedValues';
import { screen } from '@testing-library/react';

describe('Internationalization', () => {
  describe('LanguageSwitcher', () => {
    it('displays the current locale and allows switching', () => {
      const { getByText } = renderWithI18n(<LanguageSwitcher />, 'en');
      expect(getByText(/English/i)).toBeInTheDocument();
    });
    
    it('renders properly in all supported locales', () => {
      const results = renderWithMultipleLocales(<LanguageSwitcher />);
      
      // Each locale should show its language name
      expect(results.en.getByText(/English/i)).toBeInTheDocument();
      expect(results.vi.getByText(/Tiếng Việt/i)).toBeInTheDocument();
      expect(results.zh.getByText(/中文/i)).toBeInTheDocument();
      expect(results.ja.getByText(/日本語/i)).toBeInTheDocument();
      expect(results.ar.getByText(/العربية/i)).toBeInTheDocument();
      expect(results.he.getByText(/עברית/i)).toBeInTheDocument();
    });
  });
  
  describe('Formatted Values', () => {
    it('formats numbers correctly according to locale', () => {
      const value = 1234567.89;
      
      const { rerender } = renderWithI18n(<FormattedNumber value={value} />, 'en');
      expect(screen.getByText('1,234,567.89')).toBeInTheDocument();
      
      rerender(<FormattedNumber value={value} />);
      expect(screen.getByText('1,234,567.89')).toBeInTheDocument();
      
      renderWithI18n(<FormattedNumber value={value} />, 'vi');
      expect(screen.getByText('1.234.567,89')).toBeInTheDocument();
      
      renderWithI18n(<FormattedNumber value={value} />, 'ar');
      expect(screen.getByText('١٬٢٣٤٬٥٦٧٫٨٩')).toBeInTheDocument();
    });
    
    it('formats currency correctly according to locale', () => {
      const value = 1234.56;
      
      renderWithI18n(<FormattedCurrency value={value} currency="USD" />, 'en');
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
      
      renderWithI18n(<FormattedCurrency value={value} currency="USD" />, 'vi');
      expect(screen.getByText('1.234,56 $')).toBeInTheDocument();
      
      renderWithI18n(<FormattedCurrency value={value} currency="JPY" />, 'ja');
      expect(screen.getByText('￥1,235')).toBeInTheDocument();
    });
    
    it('formats dates correctly according to locale', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      
      renderWithI18n(<FormattedDate value={date} />, 'en');
      expect(screen.getByText('1/15/2023')).toBeInTheDocument();
      
      renderWithI18n(<FormattedDate value={date} />, 'vi');
      expect(screen.getByText('15/1/2023')).toBeInTheDocument();
      
      renderWithI18n(<FormattedDate value={date} />, 'zh');
      expect(screen.getByText('2023/1/15')).toBeInTheDocument();
    });
    
    it('formats times correctly according to locale', () => {
      const date = new Date(2023, 0, 15, 14, 30); // 2:30 PM
      
      renderWithI18n(<FormattedTime value={date} />, 'en');
      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
      
      renderWithI18n(<FormattedTime value={date} />, 'vi');
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });
});
