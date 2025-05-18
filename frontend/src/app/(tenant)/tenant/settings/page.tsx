import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import { Tenant, TenantPackage, TenantStatus } from '@/types/tenant';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Settings | Tenant Admin',
  description: 'Configure tenant settings and customization options',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Mock data for tenant
const mockTenant: Tenant = {
  id: '1',
  name: 'Example Company',
  slug: 'example-company',
  domain: 'example-company.example.com',
  status: 'ACTIVE',
  package: TenantPackage.PROFESSIONAL,
  createdAt: '2025-01-01',
  updatedAt: '2025-03-15',
  ownerId: '1',
  modules: ['crm', 'hrm', 'analytics'],
  brandingSettings: {
    logo: '/uploads/tenants/example-company/logo.png',
    primaryColor: '#1976d2',
    secondaryColor: '#f50057',
    faviconUrl: '/uploads/tenants/example-company/favicon.ico',
    customCss: '',
  },
  contactInfo: {
    email: 'admin@example-company.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    zipCode: '94105',
  },
};

// Mock domains data
const mockDomains = [
  {
    id: '1',
    domain: 'example-company.example.com',
    isDefault: true,
    status: 'active',
    sslEnabled: true,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    domain: 'example-company.com',
    isDefault: false,
    status: 'active',
    sslEnabled: true,
    createdAt: '2025-02-15',
  },
];

export default function SettingsPage() {
  // In a real app, this would be fetched from the API
  const tenantName = mockTenant.name;
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Branding and White-labeling */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Branding & White-labeling</CardTitle>
              <CardDescription>Customize your tenant's appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-32 rounded border border-gray-200 bg-gray-50 flex items-center justify-center dark:border-gray-800 dark:bg-gray-900">
                      <img 
                        src={mockTenant.brandingSettings?.logo || '/placeholder-logo.svg'} 
                        alt="Logo" 
                        className="max-h-12 max-w-28"
                      />
                    </div>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended size: 200x60px. Max file size: 2MB. Formats: PNG, SVG
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Favicon</label>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center dark:border-gray-800 dark:bg-gray-900">
                      <img 
                        src={mockTenant.brandingSettings?.faviconUrl || '/placeholder-favicon.svg'} 
                        alt="Favicon" 
                        className="max-h-8 max-w-8"
                      />
                    </div>
                    <Button variant="outline">Upload Favicon</Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended size: 32x32px. Formats: ICO, PNG
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="primaryColor" className="text-sm font-medium">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800" 
                        style={{ backgroundColor: mockTenant.brandingSettings?.primaryColor || '#1976d2' }}
                      ></div>
                      <Input id="primaryColor" type="text" defaultValue={mockTenant.brandingSettings?.primaryColor || '#1976d2'} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="secondaryColor" className="text-sm font-medium">
                      Secondary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800" 
                        style={{ backgroundColor: mockTenant.brandingSettings?.secondaryColor || '#f50057' }}
                      ></div>
                      <Input id="secondaryColor" type="text" defaultValue={mockTenant.brandingSettings?.secondaryColor || '#f50057'} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="customCss" className="text-sm font-medium">
                    Custom CSS
                  </label>
                  <textarea 
                    id="customCss" 
                    rows={5} 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    defaultValue={mockTenant.brandingSettings?.customCss || ''}
                    placeholder="/* Add your custom CSS here */"
                  ></textarea>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Advanced: Add custom CSS for further customization
                  </p>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button>Save Branding Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Domain Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Domain Management</CardTitle>
                  <CardDescription>Manage custom domains for your tenant</CardDescription>
                </div>
                <Button>Add Domain</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDomains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">
                        {domain.domain}
                        {domain.isDefault && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Default
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`inline-flex h-2 w-2 rounded-full ${
                          domain.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {domain.status}
                        </span>
                        {domain.sslEnabled && (
                          <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            SSL
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!domain.isDefault && (
                        <Button variant="outline" size="sm">
                          Set as Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Verify DNS
                      </Button>
                      {!domain.isDefault && (
                        <Button variant="destructive" size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Localization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Localization</CardTitle>
              <CardDescription>Language and regional settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Language</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese (Simplified)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Format</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Format</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="12">12-hour (AM/PM)</option>
                    <option value="24">24-hour</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
                
                <div className="pt-2">
                  <Button className="w-full">Save Localization</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Email Template Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">User Invitation</label>
                    <Link href="/tenant/settings/email-templates/invitation">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Email sent when inviting a new user
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Welcome Email</label>
                    <Link href="/tenant/settings/email-templates/welcome">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Email sent when a user activates their account
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password Reset</label>
                    <Link href="/tenant/settings/email-templates/passwordReset">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Email sent for password reset requests
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Notification Digest</label>
                    <Link href="/tenant/settings/email-templates/notificationDigest">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Daily/weekly summary of important events
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium">Require MFA for all users</span>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform dark:bg-gray-200" style={{ transform: 'translateX(1.5rem)' }}></span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enforce multi-factor authentication for all users
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Policy</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="standard">Standard (8+ chars, 1 number)</option>
                    <option value="strong">Strong (10+ chars, mixed case, numbers)</option>
                    <option value="very_strong">Very Strong (12+ chars, symbols, mixed case)</option>
                    <option value="custom">Custom Policy</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                    <option value="480">8 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium">IP Restrictions</span>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform dark:bg-gray-200" style={{ transform: 'translateX(0.25rem)' }}></span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Restrict access to specific IP addresses
                  </p>
                </div>
                
                <div className="pt-2">
                  <Button className="w-full">Save Security Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
