import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Module } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Module Configuration | Tenant Admin',
  description: 'Configure module settings and permissions',
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

// Mock module data
const mockModule: Module = {
  id: '1',
  name: 'CRM',
  description: 'Customer Relationship Management module for managing leads, contacts, and sales pipelines',
  status: 'ACTIVE',
  version: '1.5.0',
  price: 49.99,
  category: 'sales',
  icon: '/icons/crm.svg',
  requiredPermissions: ['crm.view', 'crm.edit', 'crm.admin'],
  configurations: {
    leadCapture: {
      enabled: true,
      formFields: ['name', 'email', 'phone', 'company', 'message'],
      notificationEmail: 'sales@example.com',
    },
    pipeline: {
      stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      defaultStage: 'Lead',
    },
    contacts: {
      customFields: [
        { name: 'industry', type: 'select', options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Other'] },
        { name: 'source', type: 'select', options: ['Website', 'Referral', 'Event', 'Social Media', 'Other'] },
      ],
    },
    integration: {
      email: true,
      calendar: true,
      slack: false,
      zapier: true,
    },
  },
  createdAt: '2025-01-01',
  updatedAt: '2025-05-01',
};

// Mock usage data
const mockModuleUsage = {
  activeUsers: 28,
  totalRecords: 1523,
  apiCalls: {
    today: 452,
    thisWeek: 2145,
    thisMonth: 8976,
  },
  storage: {
    used: 256, // MB
    limit: 1024, // MB
  },
};

// Mock module-specific roles
const moduleRoles = [
  { id: 'admin', name: 'Admin', description: 'Full access to all CRM features' },
  { id: 'manager', name: 'Manager', description: 'Can manage contacts, leads, and view reports' },
  { id: 'user', name: 'User', description: 'Can view and edit assigned contacts and leads' },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to contacts and leads' },
];

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from the API using params.id
  const tenantName = "Example Company";
  const module = mockModule;
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">{module.name} Configuration</h1>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            v{module.version}
          </span>
        </div>
        <div className="flex space-x-4">
          <Link href={`/tenant/${module.name.toLowerCase()}`}>
            <Button>
              Open Module
            </Button>
          </Link>
          <Link href="/tenant/modules">
            <Button variant="outline">Back to Modules</Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic module settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="module-name" className="text-sm font-medium">
                      Module Display Name
                    </label>
                    <Input
                      id="module-name"
                      defaultValue={module.name}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="module-slug" className="text-sm font-medium">
                      Module Slug
                    </label>
                    <Input
                      id="module-slug"
                      defaultValue={module.name.toLowerCase()}
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used in URLs and API endpoints
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="module-description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="module-description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={module.description}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="module-enabled"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked={module.status === 'ACTIVE'}
                    />
                    <label htmlFor="module-enabled" className="ml-2 text-sm font-medium">
                      Enable Module
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    When disabled, users will not be able to access this module
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>Enable or disable specific features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-base font-semibold mb-2">Lead Capture</h3>
                  <div className="ml-6 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="lead-capture-enabled"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked={module.configurations?.leadCapture?.enabled}
                      />
                      <label htmlFor="lead-capture-enabled" className="ml-2 text-sm font-medium">
                        Enable Lead Capture Forms
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="notification-email" className="text-sm font-medium">
                        Notification Email
                      </label>
                      <Input
                        id="notification-email"
                        defaultValue={module.configurations?.leadCapture?.notificationEmail}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="form-fields" className="text-sm font-medium">
                        Required Form Fields
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['name', 'email', 'phone', 'company', 'message'].map((field) => (
                          <div key={field} className="flex items-center">
                            <input
                              id={`field-${field}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              defaultChecked={module.configurations?.leadCapture?.formFields.includes(field)}
                            />
                            <label htmlFor={`field-${field}`} className="ml-2 text-sm">
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="text-base font-semibold mb-2">Sales Pipeline</h3>
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Pipeline Stages
                      </label>
                      <div className="space-y-2">
                        {module.configurations?.pipeline?.stages.map((stage, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={stage}
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm">
                              <span className="sr-only">Delete</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm">
                          Add Stage
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="default-stage" className="text-sm font-medium">
                        Default Stage
                      </label>
                      <select 
                        id="default-stage"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={module.configurations?.pipeline?.defaultStage}
                      >
                        {module.configurations?.pipeline?.stages.map((stage) => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-semibold mb-2">Contact Management</h3>
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Custom Fields
                      </label>
                      <div className="space-y-2">
                        {module.configurations?.contacts?.customFields.map((field, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2">
                            <Input
                              value={field.name}
                              placeholder="Field name"
                            />
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.type}
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Select</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                            <Button variant="outline" size="sm">
                              Configure Options
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm">
                          Add Custom Field
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with other services and applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Email Integration */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Email Integration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sync emails with contacts and leads
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 text-sm text-green-600 dark:text-green-400">
                        Connected
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          id="email-toggle"
                          defaultChecked={module.configurations?.integration?.email}
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
                          module.configurations?.integration?.email ? 'translate-x-5' : ''
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email-provider" className="text-sm font-medium">
                        Email Provider
                      </label>
                      <select 
                        id="email-provider"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook / Office 365</option>
                        <option value="smtp">Custom SMTP</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email-sync" className="text-sm font-medium">
                        Sync Frequency
                      </label>
                      <select 
                        id="email-sync"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                        <option value="60">Every hour</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Calendar Integration */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Calendar Integration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sync meetings and schedule appointments
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 text-sm text-green-600 dark:text-green-400">
                        Connected
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          id="calendar-toggle"
                          defaultChecked={module.configurations?.integration?.calendar}
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
                          module.configurations?.integration?.calendar ? 'translate-x-5' : ''
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Slack Integration */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Slack Integration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications and create leads from Slack
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 text-sm text-gray-500 dark:text-gray-400">
                        Not connected
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          id="slack-toggle"
                          defaultChecked={module.configurations?.integration?.slack}
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
                          module.configurations?.integration?.slack ? 'translate-x-5' : ''
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button>
                      Connect Slack
                    </Button>
                  </div>
                </div>
                
                {/* Zapier Integration */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Zapier Integration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Connect with 3000+ apps via Zapier
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 text-sm text-green-600 dark:text-green-400">
                        Connected
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          id="zapier-toggle"
                          defaultChecked={module.configurations?.integration?.zapier}
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
                          module.configurations?.integration?.zapier ? 'translate-x-5' : ''
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                      <p className="text-sm">API Key: <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">c8a9d2e47f6b31a5e9d8</code></p>
                      <p className="text-sm">Webhook URL: <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">https://api.example.com/webhook/crm/zapier</code></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Roles & Permissions Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Configure module-specific roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {moduleRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium">{role.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {role.description}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit Role
                      </Button>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {module.requiredPermissions.map((perm) => (
                        <div key={perm} className="flex items-center">
                          <input
                            id={`${role.id}-${perm}`}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={role.id === 'admin' || (role.id === 'manager' && !perm.includes('admin'))}
                          />
                          <label htmlFor={`${role.id}-${perm}`} className="ml-2 text-sm">
                            {perm.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <Button variant="outline">
                  Add Custom Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage & Limits Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>Monitor resource usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
                    <div className="mt-1 text-2xl font-semibold">{mockModuleUsage.activeUsers}</div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Records</div>
                    <div className="mt-1 text-2xl font-semibold">{mockModuleUsage.totalRecords.toLocaleString()}</div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">API Calls Today</div>
                    <div className="mt-1 text-2xl font-semibold">{mockModuleUsage.apiCalls.today.toLocaleString()}</div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">API Calls This Month</div>
                    <div className="mt-1 text-2xl font-semibold">{mockModuleUsage.apiCalls.thisMonth.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-base font-semibold mb-2">Storage Usage</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{mockModuleUsage.storage.used} MB used of {mockModuleUsage.storage.limit} MB</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {Math.round((mockModuleUsage.storage.used / mockModuleUsage.storage.limit) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ width: `${(mockModuleUsage.storage.used / mockModuleUsage.storage.limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">API Usage Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Rate Limit</span>
                          <span>1000 requests/minute</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Daily Limit</span>
                          <span>100,000 requests</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Monthly Limit</span>
                          <span>3,000,000 requests</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Record Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Contacts</span>
                          <span>Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Companies</span>
                          <span>Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Documents</span>
                          <span>10,000</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
