import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';
import { UserRole } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Edit User | Tenant Admin',
  description: 'Edit a user in your organization',
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

// Mock user data
const mockUser = {
  id: '1',
  email: 'john.smith@example.com',
  firstName: 'John',
  lastName: 'Smith',
  role: UserRole.TENANT_USER,
  status: 'ACTIVE',
  mfaEnabled: false,
  permissions: ['crm.view', 'crm.edit', 'hrm.view'],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  lastLoginAt: '2025-05-16T14:45:00Z',
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from the API using params.id
  const tenantName = "Example Company";
  const user = mockUser;
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <div className="flex space-x-2">
          <Link href="/tenant/users">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="destructive">Deactivate User</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Update the user's details</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input id="firstName" placeholder="First Name" defaultValue={user.firstName} />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input id="lastName" placeholder="Last Name" defaultValue={user.lastName} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Email Address" defaultValue={user.email} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    defaultValue={user.role}
                  >
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
                          <input 
                            type="checkbox" 
                            id="crm.view" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('crm.view')}
                          />
                          <label htmlFor="crm.view" className="ml-2 text-sm">
                            View CRM Data
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="crm.edit" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('crm.edit')}
                          />
                          <label htmlFor="crm.edit" className="ml-2 text-sm">
                            Edit CRM Data
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="crm.delete" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('crm.delete')}
                          />
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
                          <input 
                            type="checkbox" 
                            id="hrm.view" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('hrm.view')}
                          />
                          <label htmlFor="hrm.view" className="ml-2 text-sm">
                            View HRM Data
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="hrm.edit" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('hrm.edit')}
                          />
                          <label htmlFor="hrm.edit" className="ml-2 text-sm">
                            Edit HRM Data
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="hrm.delete" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('hrm.delete')}
                          />
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
                          <input 
                            type="checkbox" 
                            id="analytics.view" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('analytics.view')}
                          />
                          <label htmlFor="analytics.view" className="ml-2 text-sm">
                            View Analytics Data
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="analytics.export" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={user.permissions.includes('analytics.export')}
                          />
                          <label htmlFor="analytics.export" className="ml-2 text-sm">
                            Export Analytics Data
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
              <CardDescription>Account information and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm">{user.status}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="text-sm">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium">Security</h3>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multi-Factor Authentication</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.mfaEnabled 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
