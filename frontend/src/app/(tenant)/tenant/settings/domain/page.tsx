import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Domain Configuration | Tenant Admin',
  description: 'Configure custom domains for your tenant',
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

interface Domain {
  id: string;
  domain: string;
  isVerified: boolean;
  isPrimary: boolean;
  verificationMethod: 'DNS' | 'FILE';
  sslStatus: 'ACTIVE' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export default function DomainSettingsPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // Mock domains
  const mockDomains: Domain[] = [
    {
      id: '1',
      domain: 'example-company.example.com',
      isVerified: true,
      isPrimary: true,
      verificationMethod: 'DNS',
      sslStatus: 'ACTIVE',
      createdAt: '2025-01-01',
    },
    {
      id: '2',
      domain: 'app.examplecompany.com',
      isVerified: true,
      isPrimary: false,
      verificationMethod: 'DNS',
      sslStatus: 'ACTIVE',
      createdAt: '2025-02-15',
    },
    {
      id: '3',
      domain: 'portal.examplecompany.com',
      isVerified: false,
      isPrimary: false,
      verificationMethod: 'DNS',
      sslStatus: 'PENDING',
      createdAt: '2025-05-10',
    },
  ];
  
  // Mock form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would submit this data to your API
    console.log('Adding new domain');
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Domain Configuration</h1>
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
                    item.href === '/tenant/settings/domain'
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Domains</CardTitle>
              <CardDescription>Manage your custom domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDomains.map((domain) => (
                  <div key={domain.id} className="border p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium">{domain.domain}</h3>
                          {domain.isPrimary && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">Verification:</span>
                            {domain.isVerified ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">SSL:</span>
                            {domain.sslStatus === 'ACTIVE' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : domain.sslStatus === 'PENDING' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-500">
                          Added on {new Date(domain.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!domain.isVerified && (
                          <Button size="sm" variant="outline">
                            Verify
                          </Button>
                        )}
                        
                        {!domain.isPrimary && domain.isVerified && (
                          <Button size="sm" variant="outline">
                            Set as Primary
                          </Button>
                        )}
                        
                        {!domain.isPrimary && (
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {!domain.isVerified && (
                      <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-md text-sm">
                        <h4 className="font-medium mb-2">Verification Required</h4>
                        <p className="mb-2">
                          To verify your domain ownership, add the following DNS record:
                        </p>
                        <div className="bg-white p-2 rounded border mb-2 font-mono text-xs overflow-x-auto">
                          <div className="flex items-center justify-between">
                            <span>Type: TXT</span>
                            <span>Host: _verify.{domain.domain}</span>
                            <span>Value: verify-tenant-{domain.id.substring(0, 8)}</span>
                          </div>
                        </div>
                        <p>
                          DNS changes may take up to 24 hours to propagate. You can check verification status anytime.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Domain</CardTitle>
              <CardDescription>Configure a custom domain for your application</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Domain Name
                  </label>
                  <div className="flex">
                    <Input
                      id="domain"
                      placeholder="app.yourdomain.com"
                      className="flex-1 rounded-r-none"
                      required
                    />
                    <Button className="rounded-l-none" type="submit">
                      Add Domain
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the domain name without http:// or https://
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Domain Verification Guide</CardTitle>
              <CardDescription>Learn how to verify your domain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">DNS Verification (Recommended)</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>Add a TXT record to your domain's DNS settings</li>
                    <li>Set the host to "_verify.yourdomain.com"</li>
                    <li>Set the value to the verification code provided</li>
                    <li>Wait for DNS propagation (may take up to 24 hours)</li>
                    <li>Click "Verify" to check your domain status</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">File Verification (Alternative)</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>Download the verification file from the verification screen</li>
                    <li>Upload the file to your web server at ".well-known/tenant-verification.txt"</li>
                    <li>Ensure the file is accessible at "yourdomain.com/.well-known/tenant-verification.txt"</li>
                    <li>Click "Verify" to check your domain status</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">SSL Certificates</h3>
                  <p className="text-sm">
                    After verification, SSL certificates are automatically provisioned for your domain.
                    This process usually takes 5-10 minutes, but may take up to an hour in some cases.
                    Once active, your domain will be accessible via HTTPS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
