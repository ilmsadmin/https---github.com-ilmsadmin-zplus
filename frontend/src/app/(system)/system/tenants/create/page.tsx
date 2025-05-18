import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Tenant | Multi-Tenant Platform',
  description: 'Create a new tenant in the multi-tenant platform',
};

// Define navigation items for system admin
const navItems = [
  { title: 'Dashboard', href: '/system/dashboard' },
  { title: 'Tenants', href: '/system/tenants' },
  { title: 'Packages', href: '/system/packages' },
  { title: 'Modules', href: '/system/modules' },
  { title: 'Domains', href: '/system/domains' },
  { title: 'Users', href: '/system/users' },
  { title: 'Billing', href: '/system/billing' },
  { title: 'Settings', href: '/system/settings' },
];

// Mock data for packages
const packages = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Basic', maxUsers: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Pro', maxUsers: 50 },
  { id: '550e8400-e29b-41d4-a716-446655440123', name: 'Enterprise', maxUsers: 200 },
];

// Mock data for modules
const modules = [
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'CRM', description: 'Customer Relationship Management' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'HRM', description: 'Human Resource Management' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Analytics', description: 'Data Analytics and Reporting' },
];

export default function CreateTenantPage() {
  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Tenant</h1>
        <Link href="/system/tenants">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <form className="mt-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>Basic information about the tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Tenant Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter tenant name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="schemaName" className="mb-2 block text-sm font-medium">
                  Subdomain Name
                </label>
                <div className="flex rounded-md">
                  <Input
                    id="schemaName"
                    name="schemaName"
                    type="text"
                    placeholder="Enter subdomain name"
                    required
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                    .example.com
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Must be unique, lowercase letters, numbers and hyphens only.
                </p>
              </div>
              
              <div>
                <label htmlFor="package" className="mb-2 block text-sm font-medium">
                  Package
                </label>
                <select
                  id="package"
                  name="package"
                  className="block w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                  required
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} (Up to {pkg.maxUsers} users)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="billingEmail" className="mb-2 block text-sm font-medium">
                  Billing Email
                </label>
                <Input
                  id="billingEmail"
                  name="billingEmail"
                  type="email"
                  placeholder="Enter billing email"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Select modules to enable for this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`module-${module.id}`}
                    name="modules"
                    value={module.id}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:focus:ring-indigo-600"
                  />
                  <label htmlFor={`module-${module.id}`} className="ml-2 block">
                    <span className="font-medium">{module.name}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {module.description}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin User</CardTitle>
            <CardDescription>Create an admin user for the tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="adminEmail" className="mb-2 block text-sm font-medium">
                  Admin Email
                </label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="Enter admin email"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="adminName" className="mb-2 block text-sm font-medium">
                  Admin Name
                </label>
                <Input
                  id="adminName"
                  name="adminName"
                  type="text"
                  placeholder="Enter admin name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="adminPassword" className="mb-2 block text-sm font-medium">
                  Temporary Password
                </label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  placeholder="Enter temporary password"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="adminPasswordConfirm" className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="adminPasswordConfirm"
                  name="adminPasswordConfirm"
                  type="password"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Link href="/system/tenants">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit">
            Create Tenant
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
