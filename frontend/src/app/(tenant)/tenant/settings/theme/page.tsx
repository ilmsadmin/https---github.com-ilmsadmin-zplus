import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Theme Customization | Tenant Admin',
  description: 'Customize your tenant theme and branding',
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

export default function ThemeSettingsPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // Mock theme settings
  const mockTheme = {
    logo: 'https://via.placeholder.com/150x50',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#8b5cf6',
    faviconUrl: 'https://via.placeholder.com/32x32',
    fontFamily: 'Inter, sans-serif',
  };
  
  // Mock form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would submit this data to your API
    console.log('Updating theme settings');
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Theme Customization</h1>
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
                    item.href === '/tenant/settings/theme'
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
                <CardTitle>Brand Identity</CardTitle>
                <CardDescription>Customize your brand appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="border rounded-md p-2 bg-white">
                        <img 
                          src={mockTheme.logo} 
                          alt="Company Logo" 
                          className="h-10 w-auto"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        Change Logo
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Recommended size: 200x60px, PNG or SVG format
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Favicon
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="border rounded-md p-1 bg-white">
                        <img 
                          src={mockTheme.faviconUrl} 
                          alt="Favicon" 
                          className="h-8 w-8"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        Change Favicon
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Recommended size: 32x32px, ICO or PNG format
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Colors</CardTitle>
                <CardDescription>Define your brand colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-8 w-8 rounded-md border"
                        style={{ backgroundColor: mockTheme.primaryColor }}
                      ></div>
                      <Input
                        type="text"
                        defaultValue={mockTheme.primaryColor}
                        className="w-28"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-8 w-8 rounded-md border"
                        style={{ backgroundColor: mockTheme.secondaryColor }}
                      ></div>
                      <Input
                        type="text"
                        defaultValue={mockTheme.secondaryColor}
                        className="w-28"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-8 w-8 rounded-md border"
                        style={{ backgroundColor: mockTheme.accentColor }}
                      ></div>
                      <Input
                        type="text"
                        defaultValue={mockTheme.accentColor}
                        className="w-28"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Family
                    </label>
                    <select className="form-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
                <CardDescription>Advanced customization with CSS (Enterprise plan only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <textarea 
                      className="w-full h-40 font-mono text-sm p-3 border border-gray-300 rounded-md"
                      placeholder="/* Add your custom CSS here */"
                      disabled
                    ></textarea>
                    <p className="text-sm text-amber-600 mt-1">
                      This feature requires an Enterprise plan. 
                      <Link href="/tenant/billing" className="ml-1 text-blue-600 hover:text-blue-800">
                        Upgrade your plan
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Theme Preview</CardTitle>
                <CardDescription>See how your theme will appear to users</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-md overflow-hidden">
                  <div className="h-12 bg-gray-800 flex items-center px-4">
                    <div className="text-white font-bold">Theme Preview</div>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="mb-4 flex space-x-2">
                      <div 
                        className="px-4 py-2 text-white rounded-md"
                        style={{ backgroundColor: mockTheme.primaryColor }}
                      >
                        Primary Button
                      </div>
                      <div 
                        className="px-4 py-2 text-white rounded-md"
                        style={{ backgroundColor: mockTheme.secondaryColor }}
                      >
                        Secondary Button
                      </div>
                      <div 
                        className="px-4 py-2 text-white rounded-md"
                        style={{ backgroundColor: mockTheme.accentColor }}
                      >
                        Accent Button
                      </div>
                    </div>
                    <div 
                      className="mb-4 p-4 rounded-md text-white"
                      style={{ backgroundColor: mockTheme.primaryColor }}
                    >
                      This is a sample card with your primary color
                    </div>
                    <div 
                      className="p-4 rounded-md text-white"
                      style={{ backgroundColor: mockTheme.secondaryColor }}
                    >
                      This is a sample card with your secondary color
                    </div>
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
