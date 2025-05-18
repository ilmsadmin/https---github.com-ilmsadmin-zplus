import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create User | Tenant Admin',
  description: 'Create a new user in your organization',
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

export default function CreateUserPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create User</h1>
        <Link href="/tenant/users">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the new user's details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <Input id="firstName" placeholder="First Name" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <Input id="lastName" placeholder="Last Name" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input id="email" type="email" placeholder="Email Address" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900">
                <option value="TENANT_USER">User</option>
                <option value="TENANT_ADMIN">Admin</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* CRM Module Permissions */}
                <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  <h3 className="font-medium">CRM Module</h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" id="crm.view" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="crm.view" className="ml-2 text-sm">
                        View CRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="crm.edit" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="crm.edit" className="ml-2 text-sm">
                        Edit CRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="crm.delete" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="crm.delete" className="ml-2 text-sm">
                        Delete CRM Data
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* HRM Module Permissions */}
                <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  <h3 className="font-medium">HRM Module</h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" id="hrm.view" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="hrm.view" className="ml-2 text-sm">
                        View HRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="hrm.edit" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="hrm.edit" className="ml-2 text-sm">
                        Edit HRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="hrm.delete" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="hrm.delete" className="ml-2 text-sm">
                        Delete HRM Data
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Analytics Module Permissions */}
                <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  <h3 className="font-medium">Analytics Module</h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" id="analytics.view" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="analytics.view" className="ml-2 text-sm">
                        View Analytics Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="analytics.export" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="analytics.export" className="ml-2 text-sm">
                        Export Analytics Data
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm">Send invitation email</span>
              </label>
            </div>
            
            <div className="flex justify-end">
              <Button>Create User</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
