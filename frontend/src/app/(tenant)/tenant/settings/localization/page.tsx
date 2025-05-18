import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Localization Settings | Tenant Admin',
  description: 'Configure language and locale settings for your tenant',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Roles', href: '/tenant/roles' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Sub-navigation for settings
const settingsNavItems = [
  { title: 'General', href: '/tenant/settings' },
  { title: 'Theme', href: '/tenant/settings/theme' },
  { title: 'Email Templates', href: '/tenant/settings/email-templates' },
  { title: 'Domain', href: '/tenant/settings/domain' },
  { title: 'API Keys', href: '/tenant/settings/api-keys' },
  { title: 'Localization', href: '/tenant/settings/localization' },
];

// Mock language options
const languageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸', available: true, enabled: true },
  { code: 'fr', name: 'French', flag: '🇫🇷', available: true, enabled: false },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', available: true, enabled: false },
  { code: 'de', name: 'German', flag: '🇩🇪', available: true, enabled: false },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', available: true, enabled: false },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', available: true, enabled: false },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', available: true, enabled: false },
  { code: 'it', name: 'Italian', flag: '🇮🇹', available: true, enabled: false },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', available: true, enabled: false },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', available: true, enabled: false },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', available: true, enabled: false },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', available: true, enabled: false, rtl: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', available: false, enabled: false },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', available: false, enabled: false },
  { code: 'th', name: 'Thai', flag: '🇹🇭', available: false, enabled: false },
];

// Mock date/time formats
const dateFormats = [
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '05/18/2025' },
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '18/05/2025' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2025-05-18' },
];

const timeFormats = [
  { id: '12h', label: '12-hour', example: '2:30 PM' },
  { id: '24h', label: '24-hour', example: '14:30' },
];

// Mock number formats
const numberFormats = [
  { id: 'en-US', label: '1,234.56', example: '1,234.56' },
  { id: 'fr-FR', label: '1 234,56', example: '1 234,56' },
  { id: 'de-DE', label: '1.234,56', example: '1.234,56' },
];

export default function LocalizationPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // Mock current settings
  const currentSettings = {
    defaultLanguage: 'en',
    enabledLanguages: ['en'],
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    timezone: 'America/New_York',
  };
  
  // Mock form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would submit this data to your API
    console.log('Updating localization settings');
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Localization Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="flex flex-col space-y-1">
              {settingsNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    item.href === '/tenant/settings/localization'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>
        
        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Language Settings</CardTitle>
                <CardDescription>Configure language options for your users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Language
                    </label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue={currentSettings.defaultLanguage}
                    >
                      {languageOptions
                        .filter(lang => lang.available && lang.enabled)
                        .map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      This is the default language for new users and guest visitors
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enabled Languages
                    </label>
                    <div className="space-y-2">
                      {languageOptions.map(lang => (
                        <div key={lang.code} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{lang.flag}</span>
                            <div>
                              <div className="font-medium">{lang.name}</div>
                              <div className="text-sm text-gray-500">{lang.code.toUpperCase()}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {!lang.available ? (
                              <span className="text-sm text-amber-600 mr-3">Requires Enterprise Plan</span>
                            ) : null}
                            
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                              <input
                                type="checkbox"
                                id={`toggle-${lang.code}`}
                                className="sr-only"
                                defaultChecked={lang.enabled}
                                disabled={!lang.available}
                              />
                              <label
                                htmlFor={`toggle-${lang.code}`}
                                className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                  !lang.available ? 'bg-gray-300' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`block h-6 w-6 rounded-full bg-white border-2 transform transition-transform duration-200 ease-in ${
                                    lang.enabled ? 'translate-x-4 border-blue-500' : 'translate-x-0 border-gray-300'
                                  } ${!lang.available ? 'opacity-50' : ''}`}
                                ></span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Date & Time Format</CardTitle>
                <CardDescription>Configure how dates and times are displayed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dateFormats.map(format => (
                        <div key={format.id} className="relative">
                          <input
                            type="radio"
                            id={`date-${format.id}`}
                            name="dateFormat"
                            value={format.id}
                            defaultChecked={currentSettings.dateFormat === format.id}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`date-${format.id}`}
                            className={`block border rounded-md p-3 cursor-pointer hover:border-blue-500 ${
                              currentSettings.dateFormat === format.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">Example: {format.example}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timeFormats.map(format => (
                        <div key={format.id} className="relative">
                          <input
                            type="radio"
                            id={`time-${format.id}`}
                            name="timeFormat"
                            value={format.id}
                            defaultChecked={currentSettings.timeFormat === format.id}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`time-${format.id}`}
                            className={`block border rounded-md p-3 cursor-pointer hover:border-blue-500 ${
                              currentSettings.timeFormat === format.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">Example: {format.example}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timezone
                    </label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue={currentSettings.timezone}
                    >
                      <option value="America/New_York">Eastern Time (ET) - America/New_York</option>
                      <option value="America/Chicago">Central Time (CT) - America/Chicago</option>
                      <option value="America/Denver">Mountain Time (MT) - America/Denver</option>
                      <option value="America/Los_Angeles">Pacific Time (PT) - America/Los_Angeles</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT) - Europe/London</option>
                      <option value="Europe/Paris">Central European Time (CET) - Europe/Paris</option>
                      <option value="Asia/Tokyo">Japan Standard Time (JST) - Asia/Tokyo</option>
                      <option value="Australia/Sydney">Australian Eastern Time (AET) - Australia/Sydney</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      This is the default timezone for all users (they can override in their profile)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Number & Currency Format</CardTitle>
                <CardDescription>Configure how numbers and currencies are displayed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {numberFormats.map(format => (
                        <div key={format.id} className="relative">
                          <input
                            type="radio"
                            id={`number-${format.id}`}
                            name="numberFormat"
                            value={format.id}
                            defaultChecked={currentSettings.numberFormat === format.id}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`number-${format.id}`}
                            className={`block border rounded-md p-3 cursor-pointer hover:border-blue-500 ${
                              currentSettings.numberFormat === format.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">Example: {format.example}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Currency
                    </label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="JPY">JPY - Japanese Yen (¥)</option>
                      <option value="CAD">CAD - Canadian Dollar (C$)</option>
                      <option value="AUD">AUD - Australian Dollar (A$)</option>
                      <option value="CNY">CNY - Chinese Yuan (¥)</option>
                      <option value="INR">INR - Indian Rupee (₹)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" type="button">Reset to Default</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
