import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';
import { Permission, Role, PermissionCategory, PERMISSION_CODES } from '@/types/role';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Edit Role | Tenant Admin',
  description: 'Edit role and permissions in your organization',
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
  
  // More permissions would be here...
];

// Mock roles
const mockRoles: Record<string, Role> = {
  '1': {
    id: '1',
    name: 'Administrator',
    description: 'Full access to all tenant resources',
    permissions: mockPermissions.slice(0, 15), // First 15 permissions
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  '2': {
    id: '2',
    name: 'Manager',
    description: 'Can manage teams and users',
    permissions: mockPermissions.slice(0, 8), // First 8 permissions
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
  '3': {
    id: '3',
    name: 'User',
    description: 'Regular user with limited access',
    permissions: mockPermissions.slice(0, 2), // First 2 permissions
    createdAt: '2025-02-01',
    updatedAt: '2025-02-01',
  },
};

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

export default function RoleDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  const roleId = params.id;
  const role = mockRoles[roleId];
  
  if (!role) {
    return (
      <DashboardLayout navItems={navItems} tenantName={tenantName}>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Role Not Found</h1>
          <p className="mb-6">The requested role does not exist or you don't have permission to view it.</p>
          <Link href="/tenant/roles">
            <Button>Back to Roles</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  
  // State for form fields
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  
  // State for selected permissions (initialize with role's current permissions)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role.permissions.map(p => p.id)
  );
  
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
  
  // Edit role form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would submit this data to your API
    console.log('Updating role:', {
      id: roleId,
      name,
      description,
      permissionIds: selectedPermissions,
    });
    
    // Redirect to roles list
    window.location.href = '/tenant/roles';
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Role: {role.name}</h1>
        <div className="flex space-x-4">
          <Link href="/tenant/roles">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="destructive">Delete Role</Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Edit the basic information for this role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created At
                  </label>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(role.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated
                  </label>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(role.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Edit the permissions for this role</CardDescription>
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
          <Button type="submit">Update Role</Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
