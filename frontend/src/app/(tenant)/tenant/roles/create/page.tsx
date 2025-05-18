import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';
import { Permission, PermissionCategory, PERMISSION_CODES } from '@/types/role';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Create Role | Tenant Admin',
  description: 'Create a new role in your organization',
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

// Mock permissions data - in a real app, this would come from the API
const mockPermissions: Permission[] = [
  // User Management
  { id: '1', name: 'View Users', description: 'Can view all users', code: PERMISSION_CODES.USER_VIEW, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '2', name: 'Create Users', description: 'Can create new users', code: PERMISSION_CODES.USER_CREATE, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '3', name: 'Edit Users', description: 'Can edit existing users', code: PERMISSION_CODES.USER_EDIT, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '4', name: 'Delete Users', description: 'Can delete users', code: PERMISSION_CODES.USER_DELETE, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Team Management
  { id: '5', name: 'View Teams', description: 'Can view all teams', code: PERMISSION_CODES.TEAM_VIEW, category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '6', name: 'Create Teams', description: 'Can create new teams', code: PERMISSION_CODES.TEAM_CREATE, category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '7', name: 'Edit Teams', description: 'Can edit existing teams', code: PERMISSION_CODES.TEAM_EDIT, category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '8', name: 'Delete Teams', description: 'Can delete teams', code: PERMISSION_CODES.TEAM_DELETE, category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Role Management
  { id: '9', name: 'View Roles', description: 'Can view all roles', code: PERMISSION_CODES.ROLE_VIEW, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '10', name: 'Create Roles', description: 'Can create new roles', code: PERMISSION_CODES.ROLE_CREATE, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '11', name: 'Edit Roles', description: 'Can edit existing roles', code: PERMISSION_CODES.ROLE_EDIT, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '12', name: 'Delete Roles', description: 'Can delete roles', code: PERMISSION_CODES.ROLE_DELETE, category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Module Management
  { id: '13', name: 'View Modules', description: 'Can view all modules', code: PERMISSION_CODES.MODULE_VIEW, category: 'Module Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '14', name: 'Configure Modules', description: 'Can configure modules', code: PERMISSION_CODES.MODULE_CONFIGURE, category: 'Module Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '15', name: 'Install Modules', description: 'Can install new modules', code: PERMISSION_CODES.MODULE_INSTALL, category: 'Module Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Settings
  { id: '16', name: 'View Settings', description: 'Can view tenant settings', code: PERMISSION_CODES.SETTINGS_VIEW, category: 'Settings', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '17', name: 'Edit Settings', description: 'Can edit tenant settings', code: PERMISSION_CODES.SETTINGS_EDIT, category: 'Settings', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Billing
  { id: '18', name: 'View Billing', description: 'Can view billing information', code: PERMISSION_CODES.BILLING_VIEW, category: 'Billing', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '19', name: 'Manage Billing', description: 'Can manage billing and payments', code: PERMISSION_CODES.BILLING_MANAGE, category: 'Billing', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // CRM Module
  { id: '20', name: 'View CRM', description: 'Can view CRM data', code: PERMISSION_CODES.CRM_VIEW, category: 'CRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '21', name: 'Create CRM Records', description: 'Can create new CRM records', code: PERMISSION_CODES.CRM_CREATE, category: 'CRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '22', name: 'Edit CRM Records', description: 'Can edit CRM records', code: PERMISSION_CODES.CRM_EDIT, category: 'CRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '23', name: 'Delete CRM Records', description: 'Can delete CRM records', code: PERMISSION_CODES.CRM_DELETE, category: 'CRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // HRM Module
  { id: '24', name: 'View HRM', description: 'Can view HRM data', code: PERMISSION_CODES.HRM_VIEW, category: 'HRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '25', name: 'Create HRM Records', description: 'Can create new HRM records', code: PERMISSION_CODES.HRM_CREATE, category: 'HRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '26', name: 'Edit HRM Records', description: 'Can edit HRM records', code: PERMISSION_CODES.HRM_EDIT, category: 'HRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '27', name: 'Delete HRM Records', description: 'Can delete HRM records', code: PERMISSION_CODES.HRM_DELETE, category: 'HRM', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  
  // Analytics Module
  { id: '28', name: 'View Analytics', description: 'Can view analytics data', code: PERMISSION_CODES.ANALYTICS_VIEW, category: 'Analytics', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: '29', name: 'Export Analytics', description: 'Can export analytics data', code: PERMISSION_CODES.ANALYTICS_EXPORT, category: 'Analytics', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

// Group permissions by category
const groupPermissionsByCategory = (permissions: Permission[]) => {
  const categories: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    if (!categories[permission.category]) {
      categories[permission.category] = [];
    }
    categories[permission.category].push(permission);
  });
  
  return categories;
};

export default function CreateRolePage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // State for selected permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Toggle a permission selection
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };
  
  // Check if a permission is selected
  const isPermissionSelected = (permissionId: string) => {
    return selectedPermissions.includes(permissionId);
  };
  
  // Group permissions by category
  const permissionsByCategory = groupPermissionsByCategory(mockPermissions);
  
  // Create role form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would submit this data to your API
    console.log('Creating role with selected permissions:', selectedPermissions);
    
    // Redirect to roles list
    window.location.href = '/tenant/roles';
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Role</h1>
        <Link href="/tenant/roles">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Define the basic information for this role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter role name"
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Enter role description"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Select the permissions for this role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">{category}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`permission-${permission.id}`}
                            type="checkbox"
                            checked={isPermissionSelected(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`permission-${permission.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                            {permission.name}
                          </label>
                          <p className="text-gray-500 dark:text-gray-400">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Link href="/tenant/roles">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit">Create Role</Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
